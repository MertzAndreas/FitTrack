namespace FitTrack.Model;

/// <summary>The body data for a day. Optional as a whole: a day either has a
/// weigh-in or it does not, and measurements and photos belong to it.</summary>
public class WeightEntry
{
  public int Id { get; set; }
  public int EntryId { get; set; }
  public Entry Entry { get; set; } = null!;

  public double WeightKg { get; set; }

  public List<BodyMeasurement> Measurements { get; set; } = [];
  public List<Photo> Photos { get; set; } = [];
}
