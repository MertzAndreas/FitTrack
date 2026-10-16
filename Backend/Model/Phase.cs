namespace FitTrack.Model;

/// <summary>
/// A goal: a dated stretch of time with one target weight and one target rate.
/// Phases are sequential i.e: a cut, then a maintain, then a bulk.
/// </summary>
public class Phase
{
  public int Id { get; set; }

  /// <summary>Inclusive.</summary>
  public DateOnly StartDate { get; set; }

  /// <summary>Null for the open-ended current phase.</summary>
  public DateOnly? EndDate { get; set; }

  public double TargetWeightKg { get; set; }

  /// <summary>
  /// A percentage of bodyweight per week, signed: negative to lose, positive
  /// to gain. Percentage rather than flat kg/week so the pace decays with weight.
  /// </summary>
  public double RatePercentPerWeek { get; set; }

  public DateOnly? TargetDate { get; set; }
}
