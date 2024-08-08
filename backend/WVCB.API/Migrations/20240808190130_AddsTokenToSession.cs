using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WVCB.API.Migrations
{
    /// <inheritdoc />
    public partial class AddsTokenToSession : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Token",
                table: "Sessions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Token",
                table: "Sessions");
        }
    }
}
