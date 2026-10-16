namespace FitTrack.Model;

/// <summary>
/// A body measurement. 
/// </summary>
public class BodyMeasurement
{
  public int Id { get; set; }
  public int WeightEntryId { get; set; }
  public WeightEntry WeightEntry { get; set; } = null!;

  /// <summary>waist, chest, hips, arm, thigh, … . One per kind per entry.</summary>
  public string Kind { get; set; } = null!;

  public double ValueCm { get; set; }
}
