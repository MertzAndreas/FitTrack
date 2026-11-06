namespace Backend.Models;

public class WeightEntry
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }

    public double WeightKg { get; set; }
    public List<Measurement> Measurements { get; set; } = [];
    public List<WeightPhoto> Photos { get; set; } = [];
}
