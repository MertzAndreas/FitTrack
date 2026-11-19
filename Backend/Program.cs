using Backend.Data;
using Backend.Feature.Foods;
using Backend.Feature.Import;
using Backend.Feature.Photos;
using Backend.Feature.Weight;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<PhotoStorage>();
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("FitTrack"))
);
builder.Services.AddOpenApi();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await FoodDataInitializer.EnsureSeededAsync(db, app.Configuration, app.Logger);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseStaticFiles();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

var api = app.MapGroup("/api");
WeightEndpoints.Map(api);
ImportEndpoints.Map(api);
FoodEndpoints.Map(api);

app.MapFallbackToFile("index.html");

app.Run();
