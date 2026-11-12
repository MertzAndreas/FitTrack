using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFoods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Foods",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Code = table.Column<string>(type: "TEXT", nullable: true),
                    ProductName = table.Column<string>(type: "TEXT", nullable: false),
                    Brands = table.Column<string>(type: "TEXT", nullable: true),
                    ServingSize = table.Column<string>(type: "TEXT", nullable: true),
                    ServingQuantity = table.Column<double>(type: "REAL", nullable: true),
                    ImageUrl = table.Column<string>(type: "TEXT", nullable: true),
                    ImageSmallUrl = table.Column<string>(type: "TEXT", nullable: true),
                    KcalPer100g = table.Column<double>(type: "REAL", nullable: false),
                    FatPer100g = table.Column<double>(type: "REAL", nullable: false),
                    CarbsPer100g = table.Column<double>(type: "REAL", nullable: false),
                    ProteinPer100g = table.Column<double>(type: "REAL", nullable: false),
                    Source = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Foods", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Foods_Code",
                table: "Foods",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Foods_Source",
                table: "Foods",
                column: "Source");

            migrationBuilder.Sql(
                """
                CREATE VIRTUAL TABLE FoodsFts USING fts5(
                    ProductName,
                    Brands,
                    content='Foods',
                    content_rowid='Id',
                    prefix='2 3'
                );
                """
            );

            migrationBuilder.Sql(
                """
                CREATE TRIGGER Foods_AI AFTER INSERT ON Foods BEGIN
                    INSERT INTO FoodsFts(rowid, ProductName, Brands)
                    VALUES (new.Id, new.ProductName, new.Brands);
                END;
                """
            );

            migrationBuilder.Sql(
                """
                CREATE TRIGGER Foods_AD AFTER DELETE ON Foods BEGIN
                    INSERT INTO FoodsFts(FoodsFts, rowid, ProductName, Brands)
                    VALUES ('delete', old.Id, old.ProductName, old.Brands);
                END;
                """
            );

            migrationBuilder.Sql(
                """
                CREATE TRIGGER Foods_AU AFTER UPDATE ON Foods BEGIN
                    INSERT INTO FoodsFts(FoodsFts, rowid, ProductName, Brands)
                    VALUES ('delete', old.Id, old.ProductName, old.Brands);
                    INSERT INTO FoodsFts(rowid, ProductName, Brands)
                    VALUES (new.Id, new.ProductName, new.Brands);
                END;
                """
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS Foods_AI;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS Foods_AD;");
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS Foods_AU;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS FoodsFts;");

            migrationBuilder.DropTable(
                name: "Foods");
        }
    }
}
