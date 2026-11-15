namespace Backend.Feature.Photos;

public class PhotoStorage
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png"];
    private const long MaxBytes = 10 * 1024 * 1024; // 10 MiB

    private readonly string _dir;

    public PhotoStorage(IWebHostEnvironment env, IConfiguration configuration)
    {
        var configured = configuration["Storage:UploadsPath"];
        _dir = string.IsNullOrWhiteSpace(configured)
            ? Path.Combine(env.ContentRootPath, "..", "uploads")
            : Path.GetFullPath(configured);
        Directory.CreateDirectory(_dir);
    }

    public async Task<string> SaveAsync(IFormFile file, CancellationToken ct)
    {
        if (file.Length is 0 or > MaxBytes)
            throw new InvalidOperationException("Invalid file size");

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            throw new InvalidOperationException("Unsupported file type");

        var name = $"{Guid.NewGuid():N}{ext}";
        await using var stream = File.Create(Path.Combine(_dir, name));
        await file.CopyToAsync(stream, ct);
        return name;
    }

    public string? GetPath(string name)
    {
        var path = Path.GetFullPath(Path.Combine(_dir, Path.GetFileName(name)));
        return File.Exists(path) ? path : null;
    }

    public void Delete(string name)
    {
        var path = Path.GetFullPath(Path.Combine(_dir, Path.GetFileName(name)));
        File.Delete(path);
    }
}
