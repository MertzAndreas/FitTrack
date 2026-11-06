using Backend.Data;
using Backend.Feature.Photos;
using Backend.Feature.Weight;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<PhotoStorage>();
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseInMemoryDatabase("FitTrack"));
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

WeightEndpoints.Map(app);

app.Run();
