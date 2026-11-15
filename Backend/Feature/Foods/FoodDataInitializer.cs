using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Feature.Foods;

public static class FoodDataInitializer
{
    public static async Task EnsureSeededAsync(
        AppDbContext db,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger logger,
        CancellationToken ct = default
    )
    {
        if (await db.Foods.AnyAsync(f => f.Source == FoodSource.OpenFoodFacts, ct))
            return;

        var configuredPath = configuration["FoodData:CsvPath"] ?? "../OFF.csv.gz";
        var csvPath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, configuredPath));

        if (!File.Exists(csvPath))
            throw new FileNotFoundException(
                "The food database is empty and the Open Food Facts export was not found at "
                    + $"'{csvPath}'. Set FoodData:CsvPath to the export location.",
                csvPath
            );

        logger.LogInformation(
            "Seeding food database from {Path}. This only happens on the first run and takes a few minutes.",
            csvPath
        );

        var seeded = await FoodSeeder.SeedAsync(db, csvPath, logger, ct);
        logger.LogInformation("Food database seeded with {Count:N0} foods.", seeded);
    }
}
