import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GameService } from './services/game.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'game-of-life';
  gameState: any = null; // Holds the current game state
  isGameStarted = false; // Tracks whether the game has started
  leaderboard: any[] = []; // Holds the leaderboard data
  lastLifeEvent: string | null = null; // Tracks the most recent life event

  constructor(private gameService: GameService) {}

  // Start a new game with example players
  startGame(): void {
    const players = ['Alice', 'Bob']; // Example player names
    console.log('Starting game with players:', players);

    this.gameService.startGame(players).subscribe({
      next: (state) => {
        this.gameState = state;
        this.isGameStarted = true;
        this.lastLifeEvent = null; // Reset the last life event
        this.updateLeaderboard(); // Update leaderboard at the start
        console.log('Game started successfully. Current game state:', state);
      },
      error: (err) => {
        console.error('Error starting game:', err);
      },
    });
  }

  // Roll the dice for the current player's turn
  rollDice(): void {
    if (!this.isGameStarted) {
      console.warn('Cannot roll dice: The game has not started.');
      return;
    }

    const currentPlayer = this.gameState.players[this.gameState.turnIndex];
    console.log(`Rolling dice for the current player: ${currentPlayer.name}`);

    this.gameService.rollDice().subscribe({
      next: (state) => {
        this.gameState = state;
        this.lastLifeEvent = state.lastEvent || 'No event triggered this turn.';
        console.log('Dice rolled successfully. Updated game state:', state);
        console.log('Last Life Event:', this.lastLifeEvent);

        // Log updated stats for all players
        state.players.forEach((player: any) => {
          console.log(
            `Player: ${player.name}, Health: ${player.health}, Smarts: ${player.smarts}, Looks: ${player.looks}, Happiness: ${player.happiness}`
          );
        });

        this.updateLeaderboard(); // Update leaderboard after each turn
      },
      error: (err) => {
        console.error('Error rolling dice:', err);
      },
    });
  }

  // Method to calculate and update the leaderboard
  updateLeaderboard(): void {
    if (!this.gameState) return;

    this.leaderboard = [...this.gameState.players]
      .filter((player) => player.isAlive) // Only include alive players
      .sort((a, b) => b.score - a.score) // Sort by score in descending order
      .map((player) => ({
        name: player.name,
        score: player.score,
      }));

    console.log('Updated leaderboard:', this.leaderboard);
  }
}
