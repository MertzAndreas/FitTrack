namespace Backend.Models;

public class FoodEntry
{
    public int Id { get; set; }
    public int FoodId { get; set; }
    public Food Food { get; set; } = null!;
    public int BlockId { get; set; }
    public Block Block { get; set; } = null!;
    public double QuantityGrams { get; set; }
}
