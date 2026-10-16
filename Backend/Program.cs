using FitTrack.Api;
using FitTrack.Data;
using FitTrack.Storage;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var dbPath = builder.Configuration["DB_PATH"] ?? Path.Combine(AppContext.BaseDirectory, "fittrack.db");
var dataDir = Path.GetDirectoryName(dbPath) ?? AppContext.BaseDirectory;
Directory.CreateDirectory(dataDir);

builder.Services.AddDbContext<FitTrackDbContext>(options => options.UseSqlite($"Data Source={dbPath}"));
builder.Services.AddSingleton(new PhotoStore(Path.Combine(dataDir, "photos")));

builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
  scope.ServiceProvider.GetRequiredService<FitTrackDbContext>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
  app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/health", () => Results.Ok(new HealthResponse("healthy")));
app.MapWeightEndpoints();
app.MapFallbackToFile("index.html");

app.Run();

public record HealthResponse(string Status);
