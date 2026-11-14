using Backend.Models;

namespace Backend.Feature.Foods;

public record BlockDto(
    int Id,
    string Name,
    int SortOrder,
    string IconKey,
    List<FoodEntryDto> Entries
);

public record FoodEntryDto(int Id, double Quantity, FoodDto Food);

public record PostEntryDto(int FoodId, double Quantity);

public record PostFoodDto(
    string Name,
    string? Brands,
    string? Code,
    string? ServingSize,
    double? ServingQuantity,
    double KcalPer100g,
    double ProteinPer100g,
    double CarbsPer100g,
    double FatPer100g
);

public record FoodDto(
    int Id,
    string Name,
    string? Brands,
    string? Code,
    string? Img,
    FoodSource Source,
    string? ServingSize,
    double? ServingQuantity,
    double KcalPer100g,
    double ProteinPer100g,
    double CarbsPer100g,
    double FatPer100g
);
