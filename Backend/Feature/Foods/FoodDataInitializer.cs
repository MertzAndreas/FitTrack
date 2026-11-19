using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Feature.Foods;

public static class FoodDataInitializer
{
    private const string DefaultSourceUrl =
        "https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz";

    public static async Task EnsureSeededAsync(
        AppDbContext db,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken ct = default
    )
    {
        if (await db.Foods.AnyAsync(f => f.Source == FoodSource.OpenFoodFacts, ct))
        {
            logger.LogInformation("Food data already present, skipping Open Food Facts download.");
            return;
        }

        var sourceUrl = configuration["FoodData:SourceUrl"];
        if (string.IsNullOrWhiteSpace(sourceUrl))
            sourceUrl = DefaultSourceUrl;

        if (
            !Uri.TryCreate(sourceUrl, UriKind.Absolute, out var sourceUri)
            || (
                !string.Equals(
                    sourceUri.Scheme,
                    Uri.UriSchemeHttp,
                    StringComparison.OrdinalIgnoreCase
                )
                && !string.Equals(
                    sourceUri.Scheme,
                    Uri.UriSchemeHttps,
                    StringComparison.OrdinalIgnoreCase
                )
            )
        )
            throw new InvalidOperationException(
                $"FoodData:SourceUrl must be an absolute http(s) URL, but was '{sourceUrl}'."
            );

        logger.LogInformation("Downloading Open Food Facts data from {Url}", sourceUri);

        using var client = new HttpClient(
            new SocketsHttpHandler { ConnectTimeout = TimeSpan.FromSeconds(30) }
        );
        client.DefaultRequestHeaders.UserAgent.ParseAdd(
            "FitTrack (+https://github.com/mertzandreas/fittrack)"
        );

        using var response = await client.GetAsync(
            sourceUri,
            HttpCompletionOption.ResponseHeadersRead,
            ct
        );
        response.EnsureSuccessStatusCode();

        await using Stream offStream = await response.Content.ReadAsStreamAsync(ct);
        await FoodSeeder.SeedAsync(db, offStream, logger, ct);
    }
}
