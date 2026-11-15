using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Feature.Foods;

public static class FoodEndpoints
{
    public static void Map(IEndpointRouteBuilder app)
    {
        var foods = app.MapGroup("/foods");
        var log = app.MapGroup("/food-log");

        log.MapGet(
            "/{date}",
            async (DateOnly date, AppDbContext db, CancellationToken ct) =>
            {
                var blocks = await FoodService.GetBlocks(db, date).ToListAsync(ct);
                if (blocks.Count > 0)
                    return Results.Ok(blocks);

                try
                {
                    await FoodService.SeedDefaultsAsync(db, date, ct);
                }
                catch (DbUpdateException)
                {
                    db.ChangeTracker.Clear();
                }

                return Results.Ok(await FoodService.GetBlocks(db, date).ToListAsync(ct));
            }
        );

        log.MapDelete(
            "/entries/{id}",
            async (int id, AppDbContext db, CancellationToken ct) =>
            {
                var foodEntry = await db.FoodEntries.FirstOrDefaultAsync(fe => fe.Id == id, ct);

                if (foodEntry is null)
                    return Results.NotFound();

                db.FoodEntries.Remove(foodEntry);
                await db.SaveChangesAsync(ct);
                return Results.NoContent();
            }
        );

        log.MapPost(
            "/blocks/{blockId}/entries",
            async (int blockId, PostEntryDto[] entries, AppDbContext db, CancellationToken ct) =>
            {
                if (entries is not { Length: > 0 })
                    return Results.BadRequest("At least one entry is required.");

                if (entries.Any(e => e.Quantity <= 0))
                    return Results.BadRequest("Quantity must be greater than zero.");

                var block = await db
                    .Blocks.Include(b => b.Entries)
                        .ThenInclude(e => e.Food)
                    .FirstOrDefaultAsync(b => b.Id == blockId, ct);

                if (block is null)
                    return Results.NotFound("Block doesn't exist");

                var foodIds = entries.Select(e => e.FoodId).Distinct().ToArray();
                var foodsById = await db
                    .Foods.Where(f => foodIds.Contains(f.Id))
                    .ToDictionaryAsync(f => f.Id, ct);

                var missingIds = foodIds.Where(id => !foodsById.ContainsKey(id)).ToArray();
                if (missingIds.Length > 0)
                    return Results.BadRequest(
                        $"Invalid food Id(s): {string.Join(", ", missingIds)}"
                    );

                foreach (var e in entries)
                {
                    if (!foodsById.TryGetValue(e.FoodId, out var food))
                        return Results.NotFound($"Invalid food Id: {e.FoodId}");

                    db.FoodEntries.Add(
                        new FoodEntry
                        {
                            Block = block,
                            Food = food,
                            QuantityGrams = e.Quantity,
                        }
                    );
                }

                await db.SaveChangesAsync(ct);
                return Results.Ok(
                    new BlockDto(
                        block.Id,
                        block.Name,
                        block.SortOrder,
                        block.IconKey,
                        [
                            .. block
                                .Entries.OrderBy(e => e.Id)
                                .Select(e => new FoodEntryDto(
                                    e.Id,
                                    e.QuantityGrams,
                                    FoodService.FoodToDto(e.Food)
                                )),
                        ]
                    )
                );
            }
        );

        log.MapPost(
            "/blocks/{sourceId}/{destinationId}",
            async (int sourceId, int destinationId, AppDbContext db, CancellationToken ct) =>
            {
                if (sourceId == destinationId)
                    return Results.BadRequest("Can't copy from and to the same block");

                var source = await db
                    .Blocks.AsNoTracking()
                    .Include(b => b.Entries)
                    .FirstOrDefaultAsync(b => b.Id == sourceId, ct);

                if (source is null)
                    return Results.BadRequest($"BlockId {sourceId} doesn't exist");

                if (source.Entries.Count == 0)
                    return Results.NoContent();

                var destination = await db
                    .Blocks.Include(b => b.Entries)
                    .FirstOrDefaultAsync(b => b.Id == destinationId, ct);

                if (destination is null)
                    return Results.BadRequest($"BlockId {destinationId} doesn't exist");

                foreach (var entry in source.Entries)
                    destination.Entries.Add(
                        new FoodEntry
                        {
                            FoodId = entry.FoodId,
                            QuantityGrams = entry.QuantityGrams,
                        }
                    );

                await db.SaveChangesAsync(ct);

                return Results.NoContent();
            }
        );

        log.MapPost(
            "/days/{sourceDate}/{destinationDate}/copy",
            async (
                DateOnly sourceDate,
                DateOnly destinationDate,
                AppDbContext db,
                CancellationToken ct
            ) =>
            {
                if (sourceDate == destinationDate)
                    return Results.BadRequest("Can't copy from and to the same day");

                var copiedEntries = await FoodService.CopyDayAsync(
                    db,
                    sourceDate,
                    destinationDate,
                    ct
                );

                if (copiedEntries is null)
                    return Results.NotFound($"No food log for {sourceDate}");

                return Results.Ok(new { copiedEntries = copiedEntries.Value });
            }
        );

        static IResult? ValidateFood(PostFoodDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || !dto.Name.Any(char.IsLetterOrDigit))
                return Results.BadRequest("Must have a non-empty name");

            if (
                !FoodService.IsMacrosInRange(
                    dto.KcalPer100g,
                    dto.ProteinPer100g,
                    dto.FatPer100g,
                    dto.CarbsPer100g
                )
            )
                return Results.BadRequest("Invalid Macro range");

            if (
                !FoodService.MacrosAddUp(
                    dto.KcalPer100g,
                    dto.ProteinPer100g,
                    dto.FatPer100g,
                    dto.CarbsPer100g
                )
            )
                return Results.BadRequest("Macros do not fit tolerance");

            return null;
        }

        foods.MapPost(
            "",
            async (PostFoodDto newFood, AppDbContext db, CancellationToken ct) =>
            {
                if (ValidateFood(newFood) is { } validationError)
                    return validationError;

                var food = new Food
                {
                    Code = newFood.Code,
                    KcalPer100g = newFood.KcalPer100g,
                    ProteinPer100g = newFood.ProteinPer100g,
                    FatPer100g = newFood.FatPer100g,
                    CarbsPer100g = newFood.CarbsPer100g,
                    Source = FoodSource.User,
                    ProductName = newFood.Name,
                    Brands = newFood.Brands,
                    ServingSize = newFood.ServingSize,
                    ServingQuantity = newFood.ServingQuantity,
                };

                db.Foods.Add(food);
                await db.SaveChangesAsync(ct);
                return Results.Created($"/foods/{food.Id}", FoodService.FoodToDto(food));
            }
        );

        foods.MapPut(
            "/{id:int}",
            async (int id, PostFoodDto updatedFood, AppDbContext db, CancellationToken ct) =>
            {
                if (ValidateFood(updatedFood) is { } validationError)
                    return validationError;

                var food = await db.Foods.FirstOrDefaultAsync(f => f.Id == id, ct);
                if (food is null)
                    return Results.NotFound();

                food.Code = updatedFood.Code;
                food.KcalPer100g = updatedFood.KcalPer100g;
                food.ProteinPer100g = updatedFood.ProteinPer100g;
                food.FatPer100g = updatedFood.FatPer100g;
                food.CarbsPer100g = updatedFood.CarbsPer100g;
                food.ProductName = updatedFood.Name;
                food.Brands = updatedFood.Brands;
                food.ServingSize = updatedFood.ServingSize;
                food.ServingQuantity = updatedFood.ServingQuantity;

                await db.SaveChangesAsync(ct);
                return Results.Ok(FoodService.FoodToDto(food));
            }
        );

        foods.MapGet(
            "/by-code/{code}",
            async (string code, AppDbContext db, CancellationToken ct) =>
            {
                var food = await db.Foods.FirstOrDefaultAsync(f => f.Code == code, ct);
                if (food is null)
                    return Results.NotFound();

                return Results.Ok(FoodService.FoodToDto(food));
            }
        );

        foods.MapGet(
            "/search",
            async (string? q, AppDbContext db, CancellationToken ct, int limit = 20) =>
            {
                var tokens = (q ?? string.Empty).Split(
                    (char[]?)null,
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries
                );

                var ftsQuery = string.Join(
                    " ",
                    tokens
                        .Where(t => t.Any(char.IsLetterOrDigit))
                        .Select(t => $"\"{t.Replace("\"", "\"\"")}\"*")
                );

                if (ftsQuery.Length == 0)
                    return Results.Ok(Array.Empty<FoodDto>());

                var matches = await db
                    .Foods.FromSql(
                        $"""
                        SELECT f.*
                        FROM FoodsFts
                        JOIN Foods AS f ON f.Id = FoodsFts.rowid
                        WHERE FoodsFts MATCH {ftsQuery}
                        ORDER BY bm25(FoodsFts)
                        LIMIT {Math.Clamp(limit, 1, 50)}
                        """
                    )
                    .AsNoTracking()
                    .ToListAsync(ct);

                return Results.Ok(matches.Select(FoodService.FoodToDto));
            }
        );
    }
}
