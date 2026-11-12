using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Backend.Data;

/// <summary>
/// Used by the EF Core tooling so migrations can be generated without starting the
/// application (and therefore without triggering the one-time food seed).
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("Data Source=fittrack.db")
            .Options;

        return new AppDbContext(options);
    }
}
