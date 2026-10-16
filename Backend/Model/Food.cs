namespace FitTrack.Model;

/// <summary>A food that can be referenced when logging.</summary>
public class Food
{
  public int Id { get; set; }
  public string Name { get; set; } = null!;

  /// <summary>Unique when present.</summary>
  public string? Barcode { get; set; }

  public double Kcal { get; set; }
  public double ProteinG { get; set; }
  public double CarbsG { get; set; }
  public double FatG { get; set; }
  public MeasurementUnit Unit { get; set; }

  public Serving? Serving { get; set; }
}

public enum MeasurementUnit { Grams, Millilitres }

public class Serving
{
  public required string Label { get; set; }
  public double Quantity { get; set; }
  public MeasurementUnit Unit { get; set; }
}
