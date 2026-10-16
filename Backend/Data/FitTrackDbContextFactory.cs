using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FitTrack.Data;

/// <summary>
/// Used only by the <c>dotnet ef</c> tooling, so design-time commands point at a
/// throwaway file instead of the running app's database.
/// </summary>
public class FitTrackDbContextFactory : IDesignTimeDbContextFactory<FitTrackDbContext>
{
    public FitTrackDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<FitTrackDbContext>()
            .UseSqlite("Data Source=fittrack.design.db")
            .Options;

        return new FitTrackDbContext(options);
    }
}
