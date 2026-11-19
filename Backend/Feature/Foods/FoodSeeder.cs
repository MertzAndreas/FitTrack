using System.Diagnostics;
using System.Globalization;
using System.IO.Compression;
using Backend.Data;
using Backend.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Sylvan.Data.Csv;

namespace Backend.Feature.Foods;

public static class FoodSeeder
{
    private const int ProgressInterval = 250_000;
    private const int CancellationCheckInterval = 50_000;

    private static readonly string[] RequiredColumns =
    [
        "code",
        "product_name",
        "brands",
        "serving_size",
        "serving_quantity",
        "image_url",
        "image_small_url",
        "energy-kcal_100g",
        "fat_100g",
        "carbohydrates_100g",
        "proteins_100g",
    ];

    public static async Task SeedAsync(
        AppDbContext db,
        Stream stream,
        ILogger logger,
        CancellationToken ct = default
    )
    {
        await using var gzip = new GZipStream(stream, CompressionMode.Decompress);
        using var text = new StreamReader(
            gzip,
            System.Text.Encoding.UTF8,
            detectEncodingFromByteOrderMarks: true,
            bufferSize: 1 << 16
        );
        using var csv = CsvDataReader.Create(
            text,
            new CsvDataReaderOptions
            {
                HasHeaders = true,
                Delimiter = '\t',
                Culture = CultureInfo.InvariantCulture,
                BufferSize = 1 << 20,
            }
        );

        var ordinals = new Dictionary<string, int>(StringComparer.Ordinal);
        for (var i = 0; i < csv.FieldCount; i++)
            ordinals[csv.GetName(i)] = i;

        var missing = RequiredColumns.Where(c => !ordinals.ContainsKey(c)).ToArray();
        if (missing.Length > 0)
            throw new InvalidDataException(
                $"The Open Food Facts export is missing required columns: {string.Join(", ", missing)}."
            );

        var iCode = ordinals["code"];
        var iName = ordinals["product_name"];
        var iBrands = ordinals["brands"];
        var iSize = ordinals["serving_size"];
        var iQuantity = ordinals["serving_quantity"];
        var iImage = ordinals["image_url"];
        var iImageSmall = ordinals["image_small_url"];
        var iKcal = ordinals["energy-kcal_100g"];
        var iFat = ordinals["fat_100g"];
        var iCarbs = ordinals["carbohydrates_100g"];
        var iProtein = ordinals["proteins_100g"];
        var iAlcohol = ordinals.TryGetValue("alcohol_100g", out var alcoholOrdinal)
            ? alcoholOrdinal
            : -1;

        await using var connection = new SqliteConnection(db.Database.GetConnectionString());
        await connection.OpenAsync(ct);

        await using (var pragma = connection.CreateCommand())
        {
            pragma.CommandText = "PRAGMA journal_mode=WAL;";
            await pragma.ExecuteScalarAsync(ct);

            pragma.CommandText = "PRAGMA synchronous=NORMAL;";
            await pragma.ExecuteNonQueryAsync(ct);
        }

        await using var transaction = (SqliteTransaction)await connection.BeginTransactionAsync(ct);

        await using var insert = connection.CreateCommand();
        insert.Transaction = transaction;
        insert.CommandText = """
            INSERT INTO Foods
                (Code, ProductName, Brands, ServingSize, ServingQuantity, ImageUrl, ImageSmallUrl,
                 KcalPer100g, FatPer100g, CarbsPer100g, ProteinPer100g, Source)
            VALUES
                ($code, $name, $brands, $size, $quantity, $image, $imageSmall,
                 $kcal, $fat, $carbs, $protein, $source)
            ON CONFLICT(Code) DO UPDATE SET
                ProductName = excluded.ProductName,
                Brands = excluded.Brands,
                ServingSize = excluded.ServingSize,
                ServingQuantity = excluded.ServingQuantity,
                ImageUrl = excluded.ImageUrl,
                ImageSmallUrl = excluded.ImageSmallUrl,
                KcalPer100g = excluded.KcalPer100g,
                FatPer100g = excluded.FatPer100g,
                CarbsPer100g = excluded.CarbsPer100g,
                ProteinPer100g = excluded.ProteinPer100g;
            """;

        var pCode = insert.Parameters.Add("$code", SqliteType.Text);
        var pName = insert.Parameters.Add("$name", SqliteType.Text);
        var pBrands = insert.Parameters.Add("$brands", SqliteType.Text);
        var pSize = insert.Parameters.Add("$size", SqliteType.Text);
        var pQuantity = insert.Parameters.Add("$quantity", SqliteType.Real);
        var pImage = insert.Parameters.Add("$image", SqliteType.Text);
        var pImageSmall = insert.Parameters.Add("$imageSmall", SqliteType.Text);
        var pKcal = insert.Parameters.Add("$kcal", SqliteType.Real);
        var pFat = insert.Parameters.Add("$fat", SqliteType.Real);
        var pCarbs = insert.Parameters.Add("$carbs", SqliteType.Real);
        var pProtein = insert.Parameters.Add("$protein", SqliteType.Real);
        var pSource = insert.Parameters.Add("$source", SqliteType.Integer);

        long read = 0;
        long written = 0;
        long skippedMissing = 0;
        long skippedOutOfRange = 0;
        long skippedInconsistent = 0;
        var stopwatch = Stopwatch.StartNew();

        while (await csv.ReadAsync(ct))
        {
            read++;

            if (read % CancellationCheckInterval == 0)
                ct.ThrowIfCancellationRequested();

            if (read % ProgressInterval == 0)
                logger.LogInformation(
                    "Food seed: {Read:N0} rows read, {Written:N0} written, {Elapsed} elapsed.",
                    read,
                    written,
                    stopwatch.Elapsed
                );

            var code = GetText(csv, iCode);
            var name = GetText(csv, iName);
            if (code is null || name is null)
            {
                skippedMissing++;
                continue;
            }

            var kcal = GetDouble(csv, iKcal);
            var fat = GetDouble(csv, iFat);
            var carbs = GetDouble(csv, iCarbs);
            var protein = GetDouble(csv, iProtein);
            if (kcal is null || fat is null || carbs is null || protein is null)
            {
                skippedMissing++;
                continue;
            }

            var alcohol = iAlcohol >= 0 ? GetDouble(csv, iAlcohol) ?? 0 : 0;

            if (
                !FoodService.IsMacrosInRange(
                    kcal.Value,
                    protein.Value,
                    fat.Value,
                    carbs.Value,
                    alcohol
                )
            )
            {
                skippedOutOfRange++;
                continue;
            }

            if (
                !FoodService.MacrosAddUp(kcal.Value, protein.Value, fat.Value, carbs.Value, alcohol)
            )
            {
                skippedInconsistent++;
                continue;
            }

            pCode.Value = code;
            pName.Value = name;
            pBrands.Value = (object?)GetText(csv, iBrands) ?? DBNull.Value;
            pSize.Value = (object?)GetText(csv, iSize) ?? DBNull.Value;
            pQuantity.Value = (object?)GetDouble(csv, iQuantity) ?? DBNull.Value;
            pImage.Value = (object?)GetText(csv, iImage) ?? DBNull.Value;
            pImageSmall.Value = (object?)GetText(csv, iImageSmall) ?? DBNull.Value;
            pKcal.Value = kcal.Value;
            pFat.Value = fat.Value;
            pCarbs.Value = carbs.Value;
            pProtein.Value = protein.Value;
            pSource.Value = (int)FoodSource.OpenFoodFacts;

            await insert.ExecuteNonQueryAsync(ct);
            written++;
        }

        await transaction.CommitAsync(ct);

        logger.LogInformation(
            "Food seed finished: {Read:N0} rows read, {Written:N0} written, "
                + "{SkippedMissing:N0} missing, {SkippedRange:N0} out of range, "
                + "{SkippedKcal:N0} inconsistent energy in {Elapsed}.",
            read,
            written,
            skippedMissing,
            skippedOutOfRange,
            skippedInconsistent,
            stopwatch.Elapsed
        );
    }

    private static string? GetText(CsvDataReader csv, int ordinal)
    {
        if (csv.IsDBNull(ordinal))
            return null;

        var value = csv.GetString(ordinal).Trim();
        return value.Length == 0 ? null : value;
    }

    private static double? GetDouble(CsvDataReader csv, int ordinal)
    {
        if (csv.IsDBNull(ordinal))
            return null;

        var value = csv.GetString(ordinal);
        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (
            !double.TryParse(
                value,
                NumberStyles.Float,
                CultureInfo.InvariantCulture,
                out var result
            )
        )
            return null;

        return double.IsFinite(result) ? result : null;
    }
}
