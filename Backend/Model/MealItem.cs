namespace FitTrack.Model;

/// <summary>
/// One food, at an amount, inside a block. Stores no kcal or macros — those are
/// derived from the food and the amount, so they can never disagree.
/// </summary>
public class MealItem
{
  public int Id { get; set; }
  public int BlockId { get; set; }
  public MealBlock Block { get; set; } = null!;

  public int FoodId { get; set; }
  public Food Food { get; set; } = null!;

  public double Amount { get; set; }
}
