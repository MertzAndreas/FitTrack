using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueBlockNamePerDay : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Blocks_DailyLogId",
                table: "Blocks");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Blocks",
                type: "TEXT",
                nullable: false,
                collation: "NOCASE",
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_DailyLogId_Name",
                table: "Blocks",
                columns: new[] { "DailyLogId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Blocks_DailyLogId_Name",
                table: "Blocks");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Blocks",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldCollation: "NOCASE");

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_DailyLogId",
                table: "Blocks",
                column: "DailyLogId");
        }
    }
}
