using Microsoft.EntityFrameworkCore;
using GameOfLife.Models;

namespace GameOfLife.Data
{
    public class GameDbContext : DbContext
    {
        public DbSet<Player> Players { get; set; }
        public DbSet<GameState> GameStates { get; set; }

        public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }
    }
}
