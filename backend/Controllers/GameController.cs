using Microsoft.AspNetCore.Mvc;
using GameOfLife.Models; // Add this to reference GameState and Player

namespace GameOfLife.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private static GameState gameState = new GameState();

        [HttpPost("start")]
        public ActionResult<GameState> StartGame([FromBody] List<string> playerNames)
        {
            if (playerNames == null || !playerNames.Any())
            {
                return BadRequest("Player names must be provided.");
            }

            gameState = new GameState
            {
                Players = playerNames.Select(name => new Player
                {
                    Name = name,
                    Health = 100,
                    Smarts = 50,
                    Looks = 50,
                    Happiness = 75,
                    IsAlive = true,
                    Year = 1,
                    Position = 0
                }).ToList(),
                TurnIndex = 0,
                IsGameOver = false,
                LastEvent = "Game Started!"
            };

            return Ok(gameState);
        }

        [HttpPost("roll")]
        public ActionResult<GameState> RollDice()
        {
            if (gameState == null || !gameState.Players.Any())
            {
                return BadRequest("Game has not been started.");
            }

            if (gameState.IsGameOver)
            {
                return BadRequest("Game is over!");
            }

            var currentPlayer = gameState.Players[gameState.TurnIndex];
            if (!currentPlayer.IsAlive)
            {
                return BadRequest($"{currentPlayer.Name} is no longer alive.");
            }

            // Roll the dice and move the player
            var diceRoll = new System.Random().Next(1, 7);
            currentPlayer.Position += diceRoll;

            // Check for board cycle completion
            const int boardSize = 40; // Number of cells on the board
            if (currentPlayer.Position >= boardSize)
            {
                currentPlayer.Position %= boardSize;
                currentPlayer.Year++;

                // Trigger life event every 5 years
                if (currentPlayer.Year % 5 == 0)
                {
                    string lifeEvent = ApplyLifeEvent(currentPlayer);
                    gameState.LastEvent = lifeEvent;
                }
            }

            // Handle good and bad events based on position
            string positionEvent = ApplyPositionEvent(currentPlayer);
            if (!string.IsNullOrEmpty(positionEvent))
            {
                gameState.LastEvent = positionEvent;
            }

            // Check if the player is alive after the event
            if (currentPlayer.Health <= 0 || currentPlayer.Happiness <= 0)
            {
                currentPlayer.IsAlive = false;
            }

            // Check if the game is over
            gameState.IsGameOver = gameState.Players.All(p => !p.IsAlive);

            // Move to the next player's turn if the game is not over
            if (!gameState.IsGameOver)
            {
                gameState.TurnIndex = (gameState.TurnIndex + 1) % gameState.Players.Count;
            }

            return Ok(gameState);
        }

        private string ApplyPositionEvent(Player player)
        {
            var random = new System.Random();

            // Positions triggering events
            var goodEventPositions = new HashSet<int> { 5, 15, 25, 35 }; // Example good event positions
            var badEventPositions = new HashSet<int> { 10, 20, 30, 40 }; // Example bad event positions

            // Handle good events
            if (goodEventPositions.Contains(player.Position))
            {
                string statIncreased = ApplyGoodEvent(player, random);
                return $"Good event! Your {statIncreased} increased.";
            }

            // Handle bad events
            if (badEventPositions.Contains(player.Position))
            {
                string statDecreased = ApplyBadEvent(player, random);
                return $"Bad event! Your {statDecreased} decreased.";
            }

            // If no event is triggered
            return string.Empty;
        }

        private string ApplyLifeEvent(Player player)
        {
            var random = new System.Random();

            // Define life events based on year
            var events = new List<(string description, Action<Player> effect)>
            {
                ("Major illness! -20 Health", p => p.Health -= 20),
                ("Won a scholarship! +15 Smarts", p => p.Smarts += 15),
                ("Marriage! +20 Happiness", p => p.Happiness += 20),
                ("Bad financial investment! -15 Happiness", p => p.Happiness -= 15),
                ("Joined a gym! +10 Health", p => p.Health += 10),
                ("Promotion at work! +15 Looks", p => p.Looks += 15),
            };

            var chosenEvent = events[random.Next(events.Count)];
            chosenEvent.effect(player);

            // Cap stats between 0 and 100
            CapStats(player);

            return chosenEvent.description;
        }

        private string ApplyGoodEvent(Player player, System.Random random)
        {
            // Stats to randomly increase
            var stats = new List<(string name, Action<Player> increase)>
            {
                ("Health", p => p.Health += 10),
                ("Smarts", p => p.Smarts += 10),
                ("Looks", p => p.Looks += 10),
                ("Happiness", p => p.Happiness += 10),
            };

            // Choose a random stat to increase
            var chosenStat = stats[random.Next(stats.Count)];
            chosenStat.increase(player);

            // Cap stats between 0 and 100
            CapStats(player);

            return chosenStat.name;
        }

        private string ApplyBadEvent(Player player, System.Random random)
        {
            // Stats to choose from
            var stats = new List<(string name, Action<Player> decrease)>
            {
                ("Health", p => p.Health -= 10),
                ("Smarts", p => p.Smarts -= 10),
                ("Looks", p => p.Looks -= 10),
                ("Happiness", p => p.Happiness -= 10),
            };

            // Allow the player to choose a stat to decrease (mocked for simplicity)
            var chosenStat = stats[random.Next(stats.Count)]; // Replace with player input logic
            chosenStat.decrease(player);

            // Cap stats between 0 and 100
            CapStats(player);

            return chosenStat.name;
        }

        private void CapStats(Player player)
        {
            player.Health = Math.Clamp(player.Health, 0, 100);
            player.Smarts = Math.Clamp(player.Smarts, 0, 100);
            player.Looks = Math.Clamp(player.Looks, 0, 100);
            player.Happiness = Math.Clamp(player.Happiness, 0, 100);
        }
    }
}
