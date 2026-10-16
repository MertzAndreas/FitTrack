using SkiaSharp;

namespace FitTrack.Storage;

/// <summary>Photos on disk, under the photo root.</summary>
public class PhotoStore(string root)
{
    private const int MaxDimension = 1600;

    private const int Quality = 85;

    /// <summary>Returns null if the bytes are not a decodable image.</summary>
    public async Task<string?> SaveAsync(Stream input, CancellationToken ct = default)
    {
        using var original = SKBitmap.Decode(input);
        if (original is null)
        {
            return null;
        }

        using var scaled = Scale(original);

        var relativePath = RelativePathFor(DateTimeOffset.UtcNow);
        var fullPath = Path.Combine(root, relativePath);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await Task.Run(() =>
        {
            using var image = SKImage.FromBitmap(scaled);
            using var data = image.Encode(SKEncodedImageFormat.Jpeg, Quality);
            using var file = File.Create(fullPath);
            data.SaveTo(file);
        }, ct);

        return relativePath;
    }

    /// <summary>Returns null if the path escapes the root.</summary>
    public string? Resolve(string relativePath)
    {
        var rootFull = Path.GetFullPath(root);
        var full = Path.GetFullPath(Path.Combine(rootFull, relativePath));
        return full.StartsWith(rootFull + Path.DirectorySeparatorChar) ? full : null;
    }

    public void Delete(string relativePath)
    {
        var full = Resolve(relativePath);
        if (full is not null && File.Exists(full))
        {
            File.Delete(full);
        }
    }

    private static SKBitmap Scale(SKBitmap source)
    {
        var longest = Math.Max(source.Width, source.Height);
        if (longest <= MaxDimension)
        {
            return source.Copy();
        }

        var ratio = (float)MaxDimension / longest;
        var width = (int)Math.Round(source.Width * ratio);
        var height = (int)Math.Round(source.Height * ratio);

        return source.Resize(new SKImageInfo(width, height), SKSamplingOptions.Default)
            ?? source.Copy();
    }

    private static string RelativePathFor(DateTimeOffset now) =>
        Path.Combine(
            now.Year.ToString(),
            now.Month.ToString("D2"),
            $"{Guid.NewGuid()}.jpg");
}
