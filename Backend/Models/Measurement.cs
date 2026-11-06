namespace Backend.Models;

public class Measurement
{
  public int Id { get; set; }
  public required string Name { get; set; }
  public double LengthCm { get; set; }
}
