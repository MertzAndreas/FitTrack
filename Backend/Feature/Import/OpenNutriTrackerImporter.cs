using System.IO.Compression;
using System.Text.Json;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Feature.Import;

public static class OpenNutriTrackerImporter
{
    public sealed record WeightImportResult(
        int TotalRecords,
        int Inserted,
        int Updated,
        int Unchanged,
        int Skipped
    );

    private sealed class WeightLogRecord
    {
        public DateTime Date { get; set; }
        public double WeightKg { get; set; }
    }

    public static async Task<WeightImportResult> ImportWeightAsync(
        AppDbContext db,
        string exportPath,
        CancellationToken ct = default
    )
    {
        var records = await ReadWeightLogAsync(exportPath, ct);
        var byDate = new Dictionary<DateOnly, double>();
        var skipped = 0;

        foreach (var record in records)
        {
            var date = DateOnly.FromDateTime(record.Date);
            if (byDate.ContainsKey(date))
                skipped++;

            byDate[date] = record.WeightKg;
        }

        var existing = await db
            .WeightEntries.Include(w => w.DailyLog)
            .ToDictionaryAsync(w => w.DailyLog.Date, ct);
        var dailyLogs = await db.DailyLogs.ToDictionaryAsync(d => d.Date, ct);
        var inserted = 0;
        var updated = 0;
        var unchanged = 0;

        foreach (var (date, weightKg) in byDate.OrderBy(x => x.Key))
        {
            if (existing.TryGetValue(date, out var entry))
            {
                if (entry.WeightKg == weightKg)
                {
                    unchanged++;
                    continue;
                }

                entry.WeightKg = weightKg;
                updated++;
                continue;
            }

            if (!dailyLogs.TryGetValue(date, out var dailyLog))
            {
                dailyLog = new DailyLog { Date = date };
                db.DailyLogs.Add(dailyLog);
                dailyLogs[date] = dailyLog;
            }

            db.WeightEntries.Add(new WeightEntry { DailyLog = dailyLog, WeightKg = weightKg });
            inserted++;
        }

        await db.SaveChangesAsync(ct);

        return new WeightImportResult(records.Count, inserted, updated, unchanged, skipped);
    }

    private static async Task<List<WeightLogRecord>> ReadWeightLogAsync(
        string exportPath,
        CancellationToken ct
    )
    {
        await using var stream = OpenWeightLog(exportPath);

        return await JsonSerializer.DeserializeAsync<List<WeightLogRecord>>(
                stream,
                JsonSerializerOptions.Web,
                ct
            ) ?? [];
    }

    private static Stream OpenWeightLog(string exportPath)
    {
        if (Directory.Exists(exportPath))
        {
            var file = Directory
                .EnumerateFiles(exportPath, "weight_log.json", SearchOption.AllDirectories)
                .FirstOrDefault();

            if (file is null)
                throw new FileNotFoundException(
                    "Could not find weight_log.json in the export directory.",
                    exportPath
                );

            return File.OpenRead(file);
        }

        if (!File.Exists(exportPath))
            throw new FileNotFoundException("The export path does not exist.", exportPath);

        if (
            !string.Equals(
                Path.GetExtension(exportPath),
                ".zip",
                StringComparison.OrdinalIgnoreCase
            )
        )
            return File.OpenRead(exportPath);

        using var archive = ZipFile.OpenRead(exportPath);
        var entry =
            archive.Entries.FirstOrDefault(e =>
                string.Equals(e.Name, "weight_log.json", StringComparison.OrdinalIgnoreCase)
            )
            ?? throw new FileNotFoundException(
                "Could not find weight_log.json in the zip archive.",
                exportPath
            );

        var buffer = new MemoryStream();
        using (var entryStream = entry.Open())
            entryStream.CopyTo(buffer);

        buffer.Position = 0;
        return buffer;
    }
}
