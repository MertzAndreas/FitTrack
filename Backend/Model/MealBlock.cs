namespace FitTrack.Model;

/// <summary>A named group of items within an entry — "Breakfast", "Dinner".</summary>
public class MealBlock
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public Entry Entry { get; set; } = null!;

  public string Name { get; set; } = null!;
  public int SortOrder { get; set; }

  public List<MealItem> Items { get; set; } = [];
}
