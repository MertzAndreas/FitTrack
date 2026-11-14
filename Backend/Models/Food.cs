namespace Backend.Models;

public enum FoodSource
{
    OpenFoodFacts = 0,
    User = 1,
}

public class Food
{
    public int Id { get; set; }

    public string ProductName { get; set; } = null!;

    /// <summary>Nutrition values per 100 g.</summary>
    public double KcalPer100g { get; set; }

    public double FatPer100g { get; set; }
    public double CarbsPer100g { get; set; }
    public double ProteinPer100g { get; set; }

    public FoodSource Source { get; set; }

    /// <summary>Barcode from Open Food Facts. Null for user-created foods without one.</summary>
    public string? Code { get; set; }
    public string? Brands { get; set; }
    public string? ServingSize { get; set; }
    public double? ServingQuantity { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageSmallUrl { get; set; }
}
