namespace Backend.Feature.Foods;

using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

public static class FoodService
{
    public static bool MacrosAddUp(
        double kcal,
        double proteinG,
        double fatG,
        double carbsG,
        double alcohol = 0
    )
    {
        var expectedKcal = 4 * proteinG + 4 * carbsG + 9 * fatG + 7 * alcohol;
        var tolerance = Math.Max(10, kcal * 0.20);
        return Math.Abs(expectedKcal - kcal) <= tolerance;
    }

    public static bool IsMacrosInRange(
        double kcal,
        double proteinG,
        double fatG,
        double carbsG,
        double alcohol = 0
    )
    {
        return IsInRange(fatG, 100)
            && IsInRange(carbsG, 100)
            && IsInRange(proteinG, 100)
            && IsInRange(kcal, 900)
            && IsInRange(alcohol, 100);
    }

    private static bool IsInRange(double value, double max) => value >= 0 && value <= max;

    public static List<Block> CreateDefaultBlocks() =>
        [
            new()
            {
                Name = "Breakfast",
                SortOrder = 1,
                IconKey = "coffee",
                Entries = [],
            },
            new()
            {
                Name = "Lunch",
                SortOrder = 2,
                IconKey = "sandwich",
                Entries = [],
            },
            new()
            {
                Name = "Dinner",
                SortOrder = 3,
                IconKey = "burger",
                Entries = [],
            },
            new()
            {
                Name = "Snacks",
                SortOrder = 4,
                IconKey = "cookie",
                Entries = [],
            },
        ];

    public static async Task SeedDefaultsAsync(AppDbContext db, DateOnly date, CancellationToken ct)
    {
        var log = await db
            .DailyLogs.Include(dl => dl.Blocks)
            .FirstOrDefaultAsync(dl => dl.Date == date, ct);

        if (log is null)
            db.DailyLogs.Add(new DailyLog { Date = date, Blocks = CreateDefaultBlocks() });
        else if (log.Blocks.Count == 0)
            foreach (var block in CreateDefaultBlocks())
                log.Blocks.Add(block);
        else
            return;

        await db.SaveChangesAsync(ct);
    }

    public static FoodDto FoodToDto(Food food)
    {
        return new FoodDto(
            food.Id,
            food.ProductName,
            food.Brands,
            food.Code,
            food.ImageSmallUrl,
            food.Source,
            food.ServingSize,
            food.ServingQuantity,
            food.KcalPer100g,
            food.ProteinPer100g,
            food.CarbsPer100g,
            food.FatPer100g
        );
    }

    public static IQueryable<BlockDto> GetBlocks(AppDbContext db, DateOnly date) =>
        db
            .Blocks.Where(b => b.DailyLog.Date == date)
            .OrderBy(b => b.SortOrder)
            .Select(b => new BlockDto(
                b.Id,
                b.Name,
                b.SortOrder,
                b.IconKey,
                b.Entries.OrderBy(e => e.Id)
                    .Select(e => new FoodEntryDto(e.Id, e.QuantityGrams, FoodToDto(e.Food)))
                    .ToList()
            ));
}
