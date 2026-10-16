namespace FitTrack.Model;

/// <summary>The weigh-in's photos. Bytes live on disk; this holds metadata only.</summary>
public class Photo
{
  public int Id { get; set; }
  public int WeightEntryId { get; set; }
  public WeightEntry WeightEntry { get; set; } = null!;

  /// <summary>Relative to the photo root, e.g. "2026/10/&lt;uuid&gt;.jpg".</summary>
  public string Path { get; set; } = null!;
}
