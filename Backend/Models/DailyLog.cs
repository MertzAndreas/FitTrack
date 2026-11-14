namespace Backend.Models;

public class DailyLog
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public List<Block> Blocks { get; set; } = [];
    public WeightEntry? WeightEntry { get; set; }
}
