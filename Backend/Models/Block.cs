namespace Backend.Models;

public class Block
{
    public int Id { get; set; }
    public int DailyLogId { get; set; }
    public DailyLog DailyLog { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int SortOrder { get; set; }
    public string IconKey { get; set; } = "utensils";
    public List<FoodEntry> Entries { get; set; } = [];
}
