namespace FitTrack.Model;

/// <summary>One tracked day. Anchors the weigh-in and the meals.</summary>
public class Entry
{
  public int Id { get; set; }

  /// <summary>Unique — one entry per day.</summary>
  public DateOnly Date { get; set; }

  public WeightEntry? WeightEntry { get; set; }

  public List<MealBlock> MealBlocks { get; set; } = [];
}
