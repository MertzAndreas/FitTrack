using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Date = table.Column<DateOnly>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Blocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DailyLogId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    SortOrder = table.Column<int>(type: "INTEGER", nullable: false),
                    IconKey = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Blocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Blocks_DailyLogs_DailyLogId",
                        column: x => x.DailyLogId,
                        principalTable: "DailyLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FoodEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FoodId = table.Column<int>(type: "INTEGER", nullable: false),
                    BlockId = table.Column<int>(type: "INTEGER", nullable: false),
                    QuantityGrams = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FoodEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FoodEntries_Blocks_BlockId",
                        column: x => x.BlockId,
                        principalTable: "Blocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FoodEntries_Foods_FoodId",
                        column: x => x.FoodId,
                        principalTable: "Foods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Blocks_DailyLogId",
                table: "Blocks",
                column: "DailyLogId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyLogs_Date",
                table: "DailyLogs",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FoodEntries_BlockId",
                table: "FoodEntries",
                column: "BlockId");

            migrationBuilder.CreateIndex(
                name: "IX_FoodEntries_FoodId",
                table: "FoodEntries",
                column: "FoodId");

            // Add the FK as nullable/defaulted first so existing rows can be backfilled.
            migrationBuilder.AddColumn<int>(
                name: "DailyLogId",
                table: "WeightEntries",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // One DailyLog per existing weight-entry date.
            migrationBuilder.Sql(
                """
                INSERT INTO "DailyLogs" ("Date")
                SELECT DISTINCT "Date" FROM "WeightEntries" ORDER BY "Date";
                """
            );

            migrationBuilder.Sql(
                """
                UPDATE "WeightEntries"
                SET "DailyLogId" = (
                    SELECT "DailyLogs"."Id"
                    FROM "DailyLogs"
                    WHERE "DailyLogs"."Date" = "WeightEntries"."Date"
                );
                """
            );

            migrationBuilder.DropIndex(
                name: "IX_WeightEntries_Date",
                table: "WeightEntries");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "WeightEntries");

            migrationBuilder.CreateIndex(
                name: "IX_WeightEntries_DailyLogId",
                table: "WeightEntries",
                column: "DailyLogId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WeightEntries_DailyLogs_DailyLogId",
                table: "WeightEntries",
                column: "DailyLogId",
                principalTable: "DailyLogs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // SQLite can't drop the FK in place. EF's deferred table rebuild would run
            // after DailyLogs is dropped, which cascades and deletes every weight entry.
            // Do the rebuild explicitly with foreign keys disabled so child rows survive.
            migrationBuilder.Sql(
                """
                PRAGMA foreign_keys = OFF;

                DROP TABLE "FoodEntries";
                DROP TABLE "Blocks";

                CREATE TABLE "_WeightEntryDates" AS
                SELECT "WeightEntries"."Id", "DailyLogs"."Date"
                FROM "WeightEntries"
                JOIN "DailyLogs" ON "DailyLogs"."Id" = "WeightEntries"."DailyLogId";

                ALTER TABLE "WeightEntries" ADD COLUMN "Date" TEXT NOT NULL DEFAULT '0001-01-01';

                UPDATE "WeightEntries"
                SET "Date" = (
                    SELECT "_WeightEntryDates"."Date"
                    FROM "_WeightEntryDates"
                    WHERE "_WeightEntryDates"."Id" = "WeightEntries"."Id"
                );

                CREATE TABLE "ef_temp_WeightEntries" (
                    "Id" INTEGER NOT NULL CONSTRAINT "PK_WeightEntries" PRIMARY KEY AUTOINCREMENT,
                    "Date" TEXT NOT NULL,
                    "WeightKg" REAL NOT NULL
                );

                INSERT INTO "ef_temp_WeightEntries" ("Id", "Date", "WeightKg")
                SELECT "Id", "Date", "WeightKg" FROM "WeightEntries";

                DROP TABLE "WeightEntries";
                ALTER TABLE "ef_temp_WeightEntries" RENAME TO "WeightEntries";

                CREATE UNIQUE INDEX "IX_WeightEntries_Date" ON "WeightEntries" ("Date");

                DROP TABLE "_WeightEntryDates";
                DROP TABLE "DailyLogs";

                PRAGMA foreign_keys = ON;
                """,
                suppressTransaction: true
            );
        }
    }
}
