using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WeightPhoto> WeightPhotos => Set<WeightPhoto>();
    public DbSet<Measurement> Measurements => Set<Measurement>();
    public DbSet<TrackedMeasurement> TrackedMeasurements => Set<TrackedMeasurement>();
    public DbSet<Food> Foods => Set<Food>();
    public DbSet<FoodEntry> FoodEntries => Set<FoodEntry>();
    public DbSet<DailyLog> DailyLogs => Set<DailyLog>();
    public DbSet<Block> Blocks => Set<Block>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .Entity<FoodEntry>()
            .HasOne(fe => fe.Food)
            .WithMany()
            .HasForeignKey(fe => fe.FoodId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder
            .Entity<DailyLog>()
            .HasOne(dl => dl.WeightEntry)
            .WithOne(we => we.DailyLog)
            .HasForeignKey<WeightEntry>(we => we.DailyLogId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<DailyLog>()
            .HasMany(dl => dl.Blocks)
            .WithOne(b => b.DailyLog)
            .HasForeignKey(b => b.DailyLogId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder
            .Entity<Block>()
            .HasMany(b => b.Entries)
            .WithOne(fe => fe.Block)
            .HasForeignKey(fe => fe.BlockId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Block>().Property(b => b.Name).UseCollation("NOCASE");
        modelBuilder.Entity<Block>().HasIndex(b => new { b.DailyLogId, b.Name }).IsUnique();

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<DailyLog>().HasIndex(w => w.Date).IsUnique();

        modelBuilder.Entity<TrackedMeasurement>().HasKey(t => t.Site);

        modelBuilder.Entity<Food>().HasIndex(f => f.Code).IsUnique();
        modelBuilder.Entity<Food>().HasIndex(f => f.Source);
        modelBuilder.Entity<Food>().Property(f => f.Source).HasConversion<int>();

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
