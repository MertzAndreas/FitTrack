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
    public static void Map(WebApplication app)
    {
        var api = app.MapGroup("/weight");
        api.MapGet(
            "/weight",
            async (AppDbContext db) =>
                await db
                    .WeightEntries.Include(w => w.Measurements)
                    .Include(w => w.Photos)
                    .ToListAsync()
        );

        api.MapPost(
                "/weight",
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

                    var entry = await db
                        .WeightEntries.Include(w => w.Measurements)
                        .Include(w => w.Photos)
                        .FirstOrDefaultAsync(w => w.Date == form.Date, ct);

                    var isNew = entry is null;
                    if (entry is null)
                    {
                        entry = new WeightEntry { Date = form.Date };
                        db.WeightEntries.Add(entry);
                    }

                    entry.WeightKg = form.WeightKg;
                    entry.Measurements?.Clear();
                    entry.Measurements =
                    [
                        .. measurements.Select(m => new Measurement
                        {
                            Name = m.Name,
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

                    return isNew
                        ? Results.Created($"/weight/{entry.Id}", entry)
                        : Results.Ok(entry);
                }
            )
            .DisableAntiforgery();

        api.MapDelete(
            "/weight/photos/{id:int}",
            async (int id, AppDbContext db, PhotoStorage photoStore) =>
            {
                var photo = await db.WeightPhotos.FindAsync(id);
                if (photo is null)
                    return Results.NotFound();

                db.WeightPhotos.Remove(photo);
                await db.SaveChangesAsync();
                photoStore.Delete(photo.FileName);

                return Results.NoContent();
            }
        );

        api.MapGet(
            "/weight/photos/{id:int}",
            async (int id, AppDbContext db, PhotoStorage photoStore) =>
            {
                var photo = await db.WeightPhotos.FindAsync(id);
                var path = photo is null ? null : photoStore.GetPath(photo.FileName);
                return path is null ? Results.NotFound() : Results.File(path);
            }
        );
    }
}
