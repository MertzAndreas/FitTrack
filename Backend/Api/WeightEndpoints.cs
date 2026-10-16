using FitTrack.Data;
using FitTrack.Model;
using FitTrack.Storage;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Api;

public static class WeightEndpoints
{
    public static void MapWeightEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/weight");

        group.MapGet("", List);
        group.MapPut("/{date}", Upsert);
        group.MapGet("/{date}", Get);
        group.MapDelete("/{date}", Delete);

        group.MapPost("/{date}/photos", UploadPhoto).DisableAntiforgery();
        group.MapGet("/photos/{id:int}", GetPhoto);
        group.MapDelete("/photos/{id:int}", DeletePhoto);
    }

    private static async Task<IResult> List(FitTrackDbContext db, CancellationToken ct)
    {
        var entries = await db.Entries
            .Where(e => e.WeightEntry != null)
            .Include(e => e.WeightEntry!).ThenInclude(w => w.Measurements)
            .Include(e => e.WeightEntry!).ThenInclude(w => w.Photos)
            .OrderBy(e => e.Date)
            .ToListAsync(ct);

        return Results.Ok(entries.Select(e => ToResponse(e.Date, e.WeightEntry!)).ToList());
    }

    private static async Task<IResult> Delete(
        string date,
        FitTrackDbContext db,
        PhotoStore photos,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(date, out var parsed))
        {
            return Results.BadRequest($"'{date}' is not a valid date.");
        }

        var entry = await db.Entries
            .Include(e => e.WeightEntry).ThenInclude(w => w!.Photos)
            .Include(e => e.MealBlocks)
            .SingleOrDefaultAsync(e => e.Date == parsed, ct);

        if (entry?.WeightEntry is null)
        {
            return Results.NotFound();
        }

        foreach (var photo in entry.WeightEntry.Photos)
        {
            photos.Delete(photo.Path);
        }

        entry.WeightEntry = null;

        if (entry.MealBlocks.Count == 0)
        {
            db.Entries.Remove(entry);
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> Upsert(
        string date,
        WeightEntryRequest request,
        FitTrackDbContext db,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(date, out var parsed))
        {
            return Results.BadRequest($"'{date}' is not a valid date.");
        }

        if (request.WeightKg <= 0)
        {
            return Results.BadRequest("Weight must be greater than zero.");
        }

        var entry = await db.Entries
            .Include(e => e.WeightEntry).ThenInclude(w => w!.Measurements)
            .SingleOrDefaultAsync(e => e.Date == parsed, ct);

        if (entry is null)
        {
            entry = new Entry { Date = parsed };
            db.Entries.Add(entry);
        }

        if (entry.WeightEntry is null)
        {
            entry.WeightEntry = new WeightEntry();
        }

        entry.WeightEntry.WeightKg = request.WeightKg;
        entry.WeightEntry.Measurements.Clear();

        foreach (var m in request.Measurements ?? [])
        {
            entry.WeightEntry.Measurements.Add(new BodyMeasurement
            {
                Kind = m.Kind,
                ValueCm = m.ValueCm,
            });
        }

        await db.SaveChangesAsync(ct);
        return Results.Ok(ToResponse(parsed, entry.WeightEntry));
    }

    private static async Task<IResult> Get(
        string date,
        FitTrackDbContext db,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(date, out var parsed))
        {
            return Results.BadRequest($"'{date}' is not a valid date.");
        }

        var entry = await db.Entries
            .Include(e => e.WeightEntry).ThenInclude(w => w!.Measurements)
            .Include(e => e.WeightEntry).ThenInclude(w => w!.Photos)
            .SingleOrDefaultAsync(e => e.Date == parsed, ct);

        if (entry?.WeightEntry is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(ToResponse(parsed, entry.WeightEntry));
    }

    private static async Task<IResult> UploadPhoto(
        string date,
        IFormFile file,
        FitTrackDbContext db,
        PhotoStore photos,
        CancellationToken ct)
    {
        if (!DateOnly.TryParse(date, out var parsed))
        {
            return Results.BadRequest($"'{date}' is not a valid date.");
        }

        var entry = await db.Entries
            .Include(e => e.WeightEntry).ThenInclude(w => w!.Photos)
            .SingleOrDefaultAsync(e => e.Date == parsed, ct);

        if (entry?.WeightEntry is null)
        {
            return Results.NotFound("Log a weight for this day before adding photos.");
        }

        await using var stream = file.OpenReadStream();
        var path = await photos.SaveAsync(stream, ct);

        if (path is null)
        {
            return Results.BadRequest("That file is not a readable image.");
        }

        var photo = new Photo { Path = path };
        entry.WeightEntry.Photos.Add(photo);
        await db.SaveChangesAsync(ct);

        return Results.Ok(new PhotoResponse(photo.Id, $"/api/weight/photos/{photo.Id}"));
    }

    private static async Task<IResult> GetPhoto(
        int id,
        FitTrackDbContext db,
        PhotoStore photos,
        CancellationToken ct)
    {
        var photo = await db.Photos.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (photo is null)
        {
            return Results.NotFound();
        }

        var full = photos.Resolve(photo.Path);
        return full is null || !File.Exists(full)
            ? Results.NotFound()
            : Results.File(full, "image/jpeg");
    }

    private static async Task<IResult> DeletePhoto(
        int id,
        FitTrackDbContext db,
        PhotoStore photos,
        CancellationToken ct)
    {
        var photo = await db.Photos.SingleOrDefaultAsync(p => p.Id == id, ct);
        if (photo is null)
        {
            return Results.NotFound();
        }

        photos.Delete(photo.Path);
        db.Photos.Remove(photo);
        await db.SaveChangesAsync(ct);

        return Results.NoContent();
    }

    private static WeightEntryResponse ToResponse(DateOnly date, WeightEntry weight) =>
        new(
            date.ToString("yyyy-MM-dd"),
            weight.WeightKg,
            weight.Measurements
                .Select(m => new MeasurementResponse(m.Kind, m.ValueCm))
                .ToList(),
            weight.Photos
                .Select(p => new PhotoResponse(p.Id, $"/api/weight/photos/{p.Id}"))
                .ToList());
}
