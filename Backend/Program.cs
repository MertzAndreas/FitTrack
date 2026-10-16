using FitTrack.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var dbPath = builder.Configuration["DB_PATH"] ?? Path.Combine(AppContext.BaseDirectory, "fittrack.db");
var dbDir = Path.GetDirectoryName(dbPath);
if (!string.IsNullOrEmpty(dbDir))
{
  Directory.CreateDirectory(dbDir);
}
builder.Services.AddDbContext<FitTrackDbContext>(options => options.UseSqlite($"Data Source={dbPath}"));

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
app.MapFallbackToFile("index.html");

app.Run();

public record HealthResponse(string Status);
