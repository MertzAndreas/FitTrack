using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<WeightEntry> WeightEntries => Set<WeightEntry>();
    public DbSet<WeightPhoto> WeightPhotos => Set<WeightPhoto>();
    public DbSet<Measurement> Measurements => Set<Measurement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        modelBuilder.Entity<WeightEntry>().HasIndex(w => w.Date).IsUnique();
    }
}
