namespace Backend.Feature.Weight;

using System.Security.Cryptography;
using System.Text.Json;
using Backend.Data;
using Backend.Feature.Photos;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

public static class WeightEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/weight");

        api.MapGet(
            "/measurement-types",
            (HttpContext http) =>
            {
                http.Response.Headers.CacheControl = "private, max-age=86400";

                return Enum.GetValues<MeasurementSite>()
                    .Select(s => new MeasurementSiteDto((int)s, s.ToString()))
                    .ToList();
            }
        );

        api.MapGet(
            "/tracked",
            async (AppDbContext db, CancellationToken ct) =>
                await db
                    .TrackedMeasurements.AsNoTracking()
                    .OrderBy(t => t.Site)
                    .Select(t => (int)t.Site)
                    .ToListAsync(ct)
        );

        api.MapPut(
            "/tracked",
            async ([FromBody] int[] sites, AppDbContext db, CancellationToken ct) =>
            {
                if (sites.Any(s => !Enum.IsDefined(typeof(MeasurementSite), s)))
                    return Results.BadRequest("Unknown measurement site.");

                var selected = sites.Distinct().Select(s => (MeasurementSite)s).ToList();

                var existing = await db.TrackedMeasurements.ToListAsync(ct);
                db.TrackedMeasurements.RemoveRange(existing.Where(t => !selected.Contains(t.Site)));
                db.TrackedMeasurements.AddRange(
                    selected
                        .Where(s => existing.All(t => t.Site != s))
                        .Select(s => new TrackedMeasurement { Site = s })
                );
                await db.SaveChangesAsync(ct);

                return Results.Ok(selected.OrderBy(s => s).Select(s => (int)s).ToList());
            }
        );

        api.MapGet(
            "/",
            async (AppDbContext db, CancellationToken ct) =>
            {
                var entries = await db
                    .WeightEntries.AsNoTracking()
                    .Include(w => w.DailyLog)
                    .Include(w => w.Measurements)
                    .Include(w => w.Photos)
                    .OrderBy(w => w.DailyLog.Date)
                    .ToListAsync(ct);

                return entries.Select(ToDto).ToList();
            }
        );

        api.MapPost(
                "/",
                async (
                    [FromForm] UpsertWeightEntryForm form,
                    AppDbContext db,
                    PhotoStorage photoStore,
                    CancellationToken ct
                ) =>
                {
                    var measurements = string.IsNullOrWhiteSpace(form.MeasurementsJson)
                        ? []
                        : JsonSerializer.Deserialize<List<CreateMeasurement>>(
                            form.MeasurementsJson,
                            JsonSerializerOptions.Web
                        ) ?? [];

                    if (measurements.Any(m => !Enum.IsDefined(m.Site)))
                        return Results.BadRequest("Unknown measurement site.");

                    var entry = await db
                        .WeightEntries.Include(w => w.DailyLog)
                        .Include(w => w.Measurements)
                        .Include(w => w.Photos)
                        .FirstOrDefaultAsync(w => w.DailyLog.Date == form.Date, ct);

                    var isNew = entry is null;
                    if (entry is null)
                    {
                        var dailyLog = await db.DailyLogs.FirstOrDefaultAsync(
                            d => d.Date == form.Date,
                            ct
                        );
                        if (dailyLog is null)
                        {
                            dailyLog = new DailyLog { Date = form.Date };
                            db.DailyLogs.Add(dailyLog);
                        }

                        entry = new WeightEntry { DailyLog = dailyLog };
                        db.WeightEntries.Add(entry);
                    }

                    entry.WeightKg = form.WeightKg;
                    entry.Measurements?.Clear();
                    entry.Measurements =
                    [
                        .. measurements.Select(m => new Measurement
                        {
                            Site = m.Site,
                            LengthCm = m.LengthCm,
                        }),
                    ];

                    var savedFiles = new List<string>();
                    try
                    {
                        if (form.Photos is { Count: > 0 } files)
                        {
                            var knownHashes = entry.Photos.Select(p => p.ContentHash).ToHashSet();

                            foreach (var file in files)
                            {
                                string hash;
                                await using (var s = file.OpenReadStream())
                                    hash = Convert.ToHexString(await SHA256.HashDataAsync(s, ct));

                                if (!knownHashes.Add(hash))
                                    continue;

                                var name = await photoStore.SaveAsync(file, ct);
                                savedFiles.Add(name);
                                entry.Photos.Add(
                                    new WeightPhoto { FileName = name, ContentHash = hash }
                                );
                            }
                        }
                        await db.SaveChangesAsync(ct);
                    }
                    catch (InvalidOperationException ex)
                    {
                        savedFiles.ForEach(photoStore.Delete);
                        return Results.BadRequest(ex.Message);
                    }
                    catch
                    {
                        savedFiles.ForEach(photoStore.Delete);
                        throw;
                    }

                    var dto = ToDto(entry);
                    return isNew ? Results.Created($"/weight/{entry.Id}", dto) : Results.Ok(dto);
                }
            )
            .DisableAntiforgery();

        api.MapDelete(
            "/{id:int}",
            async (int id, AppDbContext db, PhotoStorage photoStore, CancellationToken ct) =>
            {
                var entry = await db
                    .WeightEntries.Include(w => w.Measurements)
                    .Include(w => w.Photos)
                    .FirstOrDefaultAsync(w => w.Id == id, ct);

                if (entry is null)
                    return Results.NotFound();

                var photoFiles = entry.Photos.Select(p => p.FileName).ToList();

                db.WeightEntries.Remove(entry);
                await db.SaveChangesAsync(ct);

                foreach (var fileName in photoFiles)
                    photoStore.Delete(fileName);

                return Results.NoContent();
            }
        );

        api.MapDelete(
            "/photos/{id:int}",
            async (int id, AppDbContext db, PhotoStorage photoStore, CancellationToken ct) =>
            {
                var photo = await db.WeightPhotos.FindAsync(id);
                if (photo is null)
                    return Results.NotFound();

                db.WeightPhotos.Remove(photo);
                await db.SaveChangesAsync(ct);
                photoStore.Delete(photo.FileName);

                return Results.NoContent();
            }
        );

        api.MapGet(
            "/photos/{id:int}",
            async (int id, AppDbContext db, PhotoStorage photoStore, HttpContext http) =>
            {
                var photo = await db.WeightPhotos.FindAsync(id);
                if (photo is null)
                    return Results.NotFound();

                var path = photoStore.GetPath(photo.FileName);
                if (path is null)
                    return Results.NotFound();

                http.Response.Headers.CacheControl = "private, max-age=31536000, immutable";

                var contentType = Path.GetExtension(path).ToLowerInvariant() switch
                {
                    ".png" => "image/png",
                    _ => "image/jpeg",
                };

                return Results.File(path, contentType, enableRangeProcessing: true);
            }
        );
    }

    private static WeightEntryDto ToDto(WeightEntry entry) =>
        new(
            entry.Id,
            entry.DailyLog.Date,
            entry.WeightKg,
            [
                .. entry.Measurements.Select(m => new MeasurementDto(
                    m.Id,
                    m.Site,
                    m.Site.ToString(),
                    m.LengthCm
                )),
            ],
            [.. entry.Photos.Select(p => new WeightPhotoDto(p.Id))]
        );
}
