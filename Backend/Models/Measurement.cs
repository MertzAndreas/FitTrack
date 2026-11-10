namespace Backend.Models;

public class Measurement
{
  public int Id { get; set; }
  public int WeightEntryId { get; set; }
  public WeightEntry WeightEntry { get; set; } = null!;
  public MeasurementSite Site { get; set; }
  public double LengthCm { get; set; }
}
