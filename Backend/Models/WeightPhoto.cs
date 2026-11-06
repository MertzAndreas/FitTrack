namespace Backend.Models
{
    public class WeightPhoto
    {
        public int Id { get; set; }
        public int WeightEntryId { get; set; }
        public string FileName { get; set; } = "";
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string ContentHash { get; set; } = "";
    }
}
