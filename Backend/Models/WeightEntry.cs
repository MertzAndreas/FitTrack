namespace Backend.Models;

public class WeightEntry
{
    public int Id { get; set; }
    public int DailyLogId { get; set; }
    public DailyLog DailyLog { get; set; } = null!;

    public double WeightKg { get; set; }
    public List<Measurement> Measurements { get; set; } = [];
    public List<WeightPhoto> Photos { get; set; } = [];
}
