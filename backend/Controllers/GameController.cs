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
                    Smarts = 100,
                    Looks = 100,
                    Happiness = 100,
                    IsAlive = true
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

            // Trigger a life event
            string lifeEvent = ApplyLifeEvent(currentPlayer);
            gameState.LastEvent = lifeEvent;

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

        [HttpGet("leaderboard")]
        public ActionResult<List<Player>> GetLeaderboard()
        {
            var leaderboard = gameState.Players
                .OrderByDescending(p => p.Score)
                .Take(10)
                .ToList();
            return Ok(leaderboard);
        }

        private string ApplyLifeEvent(Player player)
        {
            var events = new List<(string description, Action<Player> effect)>
            {
                ("Won a scholarship! +10 Smarts", p => p.Smarts += 10),
                ("Car accident! -15 Health", p => p.Health -= 15),
                ("Promotion at work! +10 Happiness", p => p.Happiness += 10),
                ("Modeled for a brand! +10 Looks", p => p.Looks += 10),
                ("Caught the flu! -5 Health", p => p.Health -= 5),
                ("Got married! +20 Happiness", p => p.Happiness += 20),
                ("Bad investment! -10 Happiness", p => p.Happiness -= 10),
                ("Exercise routine! +5 Health", p => p.Health += 5),
                ("Learned a new skill! +10 Smarts", p => p.Smarts += 10),
                ("Had a bad day at work! -5 Happiness", p => p.Happiness -= 5),
                ("Spa day! +10 Happiness", p => p.Happiness += 10),
                ("Won a beauty contest! +15 Looks", p => p.Looks += 15)
            };

            // Select a random event
            var random = new System.Random();
            var randomEvent = events[random.Next(events.Count)];
            randomEvent.effect(player); // Apply the effect

            // Cap stats between 0 and 100
            player.Health = Math.Clamp(player.Health, 0, 100);
            player.Smarts = Math.Clamp(player.Smarts, 0, 100);
            player.Looks = Math.Clamp(player.Looks, 0, 100);
            player.Happiness = Math.Clamp(player.Happiness, 0, 100);

            // Return the event description
            return randomEvent.description;
        }
    }
}
