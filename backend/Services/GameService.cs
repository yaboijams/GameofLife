using System;
using System.Collections.Generic;
using System.Linq;
using GameOfLife.Models; // Assuming this namespace contains GameState and Player models

public class GameService
{
    private GameState _gameState;

    public GameService()
    {
        _gameState = new GameState();
    }

    // Start a new game with the provided player names
    public GameState StartGame(List<string> playerNames)
    {
        if (playerNames == null || !playerNames.Any())
        {
            throw new ArgumentException("Player names must be provided.");
        }

        _gameState = new GameState
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

        Console.WriteLine($"Game started with players: {string.Join(", ", playerNames)}");
        return _gameState;
    }

    // Roll the dice for the current player
    public GameState RollDice()
    {
        if (_gameState == null || !_gameState.Players.Any())
        {
            throw new InvalidOperationException("Game has not been started.");
        }

        if (_gameState.IsGameOver)
        {
            throw new InvalidOperationException("The game is over.");
        }

        var currentPlayer = _gameState.Players[_gameState.TurnIndex];
        if (!currentPlayer.IsAlive)
        {
            throw new InvalidOperationException($"{currentPlayer.Name} is no longer alive.");
        }

        var diceRoll = new Random().Next(1, 7);
        currentPlayer.Position += diceRoll;

        // Trigger a random life event and update LastEvent
        var lifeEventDescription = ApplyLifeEvent(currentPlayer);
        _gameState.LastEvent = lifeEventDescription;

        // Check win/lose conditions
        if (currentPlayer.Health <= 0 || currentPlayer.Happiness <= 0)
        {
            currentPlayer.IsAlive = false;
            Console.WriteLine($"{currentPlayer.Name} has been removed from the game.");
        }

        _gameState.IsGameOver = _gameState.Players.All(p => !p.IsAlive);

        // Move to the next player's turn if the game is not over
        if (!_gameState.IsGameOver)
        {
            _gameState.TurnIndex = (_gameState.TurnIndex + 1) % _gameState.Players.Count;
        }

        // Debugging: Log the updated game state
        Console.WriteLine($"GameState after dice roll: {System.Text.Json.JsonSerializer.Serialize(_gameState)}");

        return _gameState;
    }

    // Apply a life event to the current player
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

        // Randomly select an event
        var randomEvent = events[new Random().Next(events.Count)];
        randomEvent.effect(player); // Apply the effect

        // Cap stats between 0 and 100
        player.Health = Math.Clamp(player.Health, 0, 100);
        player.Smarts = Math.Clamp(player.Smarts, 0, 100);
        player.Looks = Math.Clamp(player.Looks, 0, 100);
        player.Happiness = Math.Clamp(player.Happiness, 0, 100);

        // If health or happiness drops to 0, the player dies
        if (player.Health <= 0 || player.Happiness <= 0)
        {
            player.IsAlive = false;
        }

        // Debugging: Log the event and player's updated stats
        Console.WriteLine($"Event triggered: {randomEvent.description}");
        Console.WriteLine($"Updated stats for {player.Name}: Health={player.Health}, Smarts={player.Smarts}, Looks={player.Looks}, Happiness={player.Happiness}");

        return randomEvent.description;
    }
}
