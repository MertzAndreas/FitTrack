using System.IO.Compression;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Feature.Import;

public static class ImportEndpoints
{
    public static void Map(WebApplication app)
    {
        app.MapPost(
                "/import/weight",
                async ([FromForm] IFormFile file, AppDbContext db, CancellationToken ct) =>
                {
                    try
                    {
                        await ImportWeightAsync(file, db, ct);
                        return Results.NoContent();
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.BadRequest(ex.Message);
                    }
                }
            )
            .DisableAntiforgery();
    }

    private static async Task ImportWeightAsync(
        IFormFile file,
        AppDbContext db,
        CancellationToken ct
    )
    {
        await using var stream = file.OpenReadStream();
        await using var json = await OpenWeightLogAsync(stream, file.FileName, ct);

        var records = await JsonSerializer.DeserializeAsync<List<WeightLogRecord>>(
                json,
                JsonSerializerOptions.Web,
                ct
            )
            ?? [];

        var weights = records
            .Where(r => r.Date != default && r.WeightKg > 0)
            .GroupBy(r => DateOnly.FromDateTime(r.Date))
            .ToDictionary(g => g.Key, g => g.Last().WeightKg);

        var existing = await db
            .WeightEntries.Include(w => w.DailyLog)
            .ToDictionaryAsync(w => w.DailyLog.Date, ct);
        var dailyLogs = await db.DailyLogs.ToDictionaryAsync(d => d.Date, ct);

        foreach (var (date, weightKg) in weights)
        {
            if (existing.TryGetValue(date, out var entry))
            {
                entry.WeightKg = weightKg;
                continue;
            }

            if (!dailyLogs.TryGetValue(date, out var dailyLog))
            {
                dailyLog = new DailyLog { Date = date };
                db.DailyLogs.Add(dailyLog);
                dailyLogs[date] = dailyLog;
            }

            db.WeightEntries.Add(new WeightEntry { DailyLog = dailyLog, WeightKg = weightKg });
        }

        await db.SaveChangesAsync(ct);
    }

    private static async Task<Stream> OpenWeightLogAsync(
        Stream stream,
        string fileName,
        CancellationToken ct
    )
    {
        if (!string.Equals(Path.GetExtension(fileName), ".zip", StringComparison.OrdinalIgnoreCase))
            return stream;

        using var archive = new ZipArchive(stream, ZipArchiveMode.Read, leaveOpen: true);
        var entry =
            archive.Entries.FirstOrDefault(e =>
                string.Equals(e.Name, "weight_log.json", StringComparison.OrdinalIgnoreCase)
            )
            ?? throw new InvalidOperationException("weight_log.json was not found in the zip.");

        var buffer = new MemoryStream();
        await using (var entryStream = entry.Open())
            await entryStream.CopyToAsync(buffer, ct);

        buffer.Position = 0;
        return buffer;
    }

    private sealed class WeightLogRecord
    {
        public DateTime Date { get; set; }
        public double WeightKg { get; set; }
    }
}
