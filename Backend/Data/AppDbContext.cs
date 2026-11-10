using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WeightPhoto> WeightPhotos => Set<WeightPhoto>();
    public DbSet<Measurement> Measurements => Set<Measurement>();
    public DbSet<TrackedMeasurement> TrackedMeasurements => Set<TrackedMeasurement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<WeightEntry>().HasIndex(w => w.Date).IsUnique();

        modelBuilder.Entity<TrackedMeasurement>().HasKey(t => t.Site);

        modelBuilder
            .Entity<WeightEntry>()
            .HasMany(w => w.Measurements)
            .WithOne(m => m.WeightEntry)
            .HasForeignKey(m => m.WeightEntryId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<WeightEntry>()
            .HasMany(w => w.Photos)
            .WithOne(p => p.WeightEntry)
            .HasForeignKey(p => p.WeightEntryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
