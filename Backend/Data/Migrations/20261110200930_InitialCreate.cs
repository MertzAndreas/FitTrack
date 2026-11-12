using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrackedMeasurements",
                columns: table => new
                {
                    Site = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackedMeasurements", x => x.Site);
                });

            migrationBuilder.CreateTable(
                name: "WeightEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    WeightKg = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Measurements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeightEntryId = table.Column<int>(type: "INTEGER", nullable: false),
                    Site = table.Column<int>(type: "INTEGER", nullable: false),
                    LengthCm = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Measurements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Measurements_WeightEntries_WeightEntryId",
                        column: x => x.WeightEntryId,
                        principalTable: "WeightEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WeightPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    WeightEntryId = table.Column<int>(type: "INTEGER", nullable: false),
                    FileName = table.Column<string>(type: "TEXT", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ContentHash = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeightPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeightPhotos_WeightEntries_WeightEntryId",
                        column: x => x.WeightEntryId,
                        principalTable: "WeightEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Measurements_WeightEntryId",
                table: "Measurements",
                column: "WeightEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_WeightEntries_Date",
                table: "WeightEntries",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WeightPhotos_WeightEntryId",
                table: "WeightPhotos",
                column: "WeightEntryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Measurements");

            migrationBuilder.DropTable(
                name: "TrackedMeasurements");

            migrationBuilder.DropTable(
                name: "WeightPhotos");

            migrationBuilder.DropTable(
                name: "WeightEntries");
        }
    }
}
