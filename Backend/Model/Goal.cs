namespace FitTrack.Model;

/// <summary>
/// Daily macro targets. Dated rather than a single row, because targets change:
/// the goal in force on a date is the latest row at or before it.
/// </summary>
public class Goal
{
  public int Id { get; set; }

  /// <summary>Unique — one target change per day.</summary>
  public DateOnly EffectiveFrom { get; set; }

  public double Kcal { get; set; }
  public double ProteinG { get; set; }
  public double CarbsG { get; set; }
  public double FatG { get; set; }
}
