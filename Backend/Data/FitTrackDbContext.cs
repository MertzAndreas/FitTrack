using FitTrack.Model;
using Microsoft.EntityFrameworkCore;

namespace FitTrack.Data;

public class FitTrackDbContext(DbContextOptions<FitTrackDbContext> options) : DbContext(options)
{
  public DbSet<Entry> Entries => Set<Entry>();
  public DbSet<BodyMeasurement> Measurements => Set<BodyMeasurement>();
  public DbSet<Photo> Photos => Set<Photo>();
  public DbSet<Food> Foods => Set<Food>();
  public DbSet<MealBlock> MealBlocks => Set<MealBlock>();
  public DbSet<MealItem> MealItems => Set<MealItem>();
  public DbSet<Phase> Phases => Set<Phase>();
  public DbSet<Goal> Goals => Set<Goal>();

  protected override void OnModelCreating(ModelBuilder model)
  {
    model.Entity<Entry>(entity => entity.HasIndex(e => e.Date).IsUnique());

    model.Entity<BodyMeasurement>(entity =>
        entity.HasIndex(m => new { m.EntryId, m.Kind }).IsUnique());

    model.Entity<Food>(entity =>
    {
      entity.HasIndex(f => f.Barcode).IsUnique();
      entity.Property(f => f.Unit).HasConversion<string>();
    });

    model.Entity<Food>().OwnsOne(f => f.Serving, serving =>
        serving.Property(s => s.Unit).HasConversion<string>());

    model.Entity<Phase>(entity => entity.HasIndex(p => p.StartDate).IsUnique());
    model.Entity<Goal>(entity => entity.HasIndex(g => g.EffectiveFrom).IsUnique());
  }
}
