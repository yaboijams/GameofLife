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
  gameState: any = null;
  isGameStarted = false;
  leaderboard: any[] = [];
  lastLifeEvent: string = 'No life events have happened yet.';
  board: number[] = [];
  boardSize = 56;
  yearsPerCycle = 5;
  goodEventCells: number[] = [5, 15, 25, 35];
  badEventCells: number[] = [10, 20, 30, 40];
  lifeEventCells: number[] = [];
  statDependentCells: number[] = [];
  isModalVisible = false;
  modalEvent = '';
  isBadEvent = false;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.createBoard(this.boardSize);
    this.calculateLifeEventCells();
    this.calculateStatDependentCells();
  }

  createBoard(cells: number): void {
    this.board = Array.from({ length: cells }, (_, i) => i + 1);
  }

  calculateLifeEventCells(): void {
    this.lifeEventCells = this.board.filter((_, index) => (index + 1) % this.boardSize === 0);
  }

  calculateStatDependentCells(): void {
    const numberOfCells = Math.floor(this.boardSize * 0.1);
    const randomCells = new Set<number>();
    while (randomCells.size < numberOfCells) {
      const randomCell = Math.floor(Math.random() * this.boardSize) + 1;
      randomCells.add(randomCell);
    }
    this.statDependentCells = Array.from(randomCells);
  }

  playersOnCell(cellIndex: number): any[] {
    if (!this.gameState) return [];
    return this.gameState.players.filter(
      (player: any) => (player.position - 1) % this.boardSize === cellIndex
    );
  }

  getYearRange(position: number): string {
    const cycle = Math.floor((position - 1) / this.boardSize);
    const startYear = cycle * this.yearsPerCycle + 1;
    const endYear = startYear + this.yearsPerCycle - 1;
    return `${startYear}-${endYear}`;
  }

  startGame(): void {
    const players = [
      { name: 'Alice', color: '#FF79C6' }, // Neon pink
      { name: 'Bob', color: '#8BE9FD' },   // Neon cyan
      { name: 'Charlie', color: '#50FA7B' }, // Neon green
      { name: 'Diana', color: '#FF5555' } // Neon red
    ];
    this.gameService.startGame(players.map(player => player.name)).subscribe({
      next: (state) => {
        this.gameState = state;
        this.gameState.players.forEach((player: any, index: number) => {
          player.color = players[index].color; // Assign color
          player.yearRange = this.getYearRange(player.position);
        });
        this.isGameStarted = true;
        this.lastLifeEvent = 'No life events have happened yet.';
        this.updateLeaderboard();
      },
      error: (err) => console.error('Error starting game:', err),
    });
  }
  
  rollDice(): void {
  if (!this.isGameStarted) return;

  console.log("Rolling dice...");

  this.gameService.rollDice().subscribe({
    next: (state) => {
      console.log("API Response (Success):", state);
      this.gameState = state;
      const currentPlayer = this.gameState.players[this.gameState.turnIndex];

      // Update position and handle cell events
      const diceRoll = Math.floor(Math.random() * 6) + 1; // Simulate dice roll
      currentPlayer.position += diceRoll;

      // Handle board cycle and update years
      if (currentPlayer.position >= this.boardSize) {
        currentPlayer.position %= this.boardSize;
        currentPlayer.year += this.yearsPerCycle; // Add 5 years for every cycle
        currentPlayer.yearRange = this.getYearRange(currentPlayer.position);

        // Trigger life event on board cycle completion
        this.triggerLifeEvent();
      }

      // Trigger cell events for the current player immediately
      this.handleCellEvents(currentPlayer);

      // Update leaderboard after handling cell events
      this.updateLeaderboard();
    },
    error: (err) => {
      console.error("API Response (Error):", err);
    },
  });
}

  

  handleCellEvents(player: any): void {
    const currentCell = (player.position - 1) % this.boardSize + 1;

    if (this.lifeEventCells.includes(currentCell)) {
      this.triggerLifeEvent();
    } else if (this.goodEventCells.includes(currentCell)) {
      this.isBadEvent = false;
      this.triggerGoodEvent();
    } else if (this.badEventCells.includes(currentCell)) {
      this.isBadEvent = true;
      this.triggerBadEvent();
    } else if (this.statDependentCells.includes(currentCell)) {
      this.triggerStatDependentEvent(player);
    } else {
      this.lastLifeEvent = 'No event occurred this turn.';
    }
  }

  triggerLifeEvent(): void {
    const lifeEvents = [
      'You got married! +15 Happiness, +10 Looks.',
      'You graduated college! +20 Smarts.',
      'You started a new business! +15 Smarts, -5 Happiness.',
      'You bought a house! +20 Happiness.',
      'You traveled the world! +10 Happiness, +10 Smarts.',
    ];

    const selectedEvent = lifeEvents[Math.floor(Math.random() * lifeEvents.length)];
    this.modalEvent = selectedEvent;
    this.lastLifeEvent = selectedEvent;

    this.applyEventEffects(selectedEvent);
    this.isModalVisible = true;
  }

  triggerStatDependentEvent(player: any): void {
    const events = [
      {
        condition: () => player.smarts >= 75,
        event: 'You secured a high-paying career! +20 Happiness, +10 Health.',
        effect: () => {
          player.happiness += 20;
          player.health += 10;
        },
      },
      {
        condition: () => player.looks >= 70,
        event: 'You became a model! +15 Happiness, +5 Smarts.',
        effect: () => {
          player.happiness += 15;
          player.smarts += 5;
        },
      },
      {
        condition: () => player.health >= 80,
        event: 'You completed a marathon! +20 Smarts, +10 Looks.',
        effect: () => {
          player.smarts += 20;
          player.looks += 10;
        },
      },
    ];

    const applicableEvent = events.find((e) => e.condition());
    if (applicableEvent) {
      this.modalEvent = applicableEvent.event;
      this.lastLifeEvent = applicableEvent.event;
      applicableEvent.effect();
    } else {
      this.modalEvent = 'No applicable event occurred.';
      this.lastLifeEvent = 'No stat-dependent event occurred.';
    }

    this.isModalVisible = true;
    this.capStats(player);
  }

  triggerGoodEvent(): void {
    const goodEvents = [
      'You won a fitness challenge! +10 Health.',
      'You aced a test! +10 Smarts.',
      'You got a makeover! +10 Looks.',
      'You went on a fun vacation! +10 Happiness.',
    ];

    const selectedEvent = goodEvents[Math.floor(Math.random() * goodEvents.length)];
    this.modalEvent = selectedEvent;
    this.lastLifeEvent = selectedEvent;

    this.applyEventEffects(selectedEvent);
    this.isModalVisible = true;
  }

  triggerBadEvent(): void {
    const badEvents = [
      'You tripped while running! Choose a stat to decrease.',
      'You missed an important exam! Choose a stat to decrease.',
      'You fell ill! Choose a stat to decrease.',
    ];

    const selectedEvent = badEvents[Math.floor(Math.random() * badEvents.length)];
    this.modalEvent = selectedEvent;
    this.lastLifeEvent = selectedEvent;

    this.isBadEvent = true;
    this.isModalVisible = true;
  }

  applyBadEvent(stat: string): void {
    const currentPlayer = this.gameState.players[this.gameState.turnIndex];

    switch (stat) {
      case 'Health':
        currentPlayer.health = Math.max(currentPlayer.health - 10, 0);
        break;
      case 'Smarts':
        currentPlayer.smarts = Math.max(currentPlayer.smarts - 10, 0);
        break;
      case 'Looks':
        currentPlayer.looks = Math.max(currentPlayer.looks - 10, 0);
        break;
      case 'Happiness':
        currentPlayer.happiness = Math.max(currentPlayer.happiness - 10, 0);
        break;
    }

    this.capStats(currentPlayer);
    this.isModalVisible = false;
    this.isBadEvent = false;
    this.updateLeaderboard();
  }

  applyEventEffects(eventDescription: string): void {
    const currentPlayer = this.gameState.players[this.gameState.turnIndex];

    if (eventDescription.includes('Happiness')) {
      currentPlayer.happiness += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Smarts')) {
      currentPlayer.smarts += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Looks')) {
      currentPlayer.looks += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Health')) {
      currentPlayer.health += eventDescription.includes('+') ? 10 : -10;
    }

    this.capStats(currentPlayer);
  }

  capStats(player: any): void {
    player.health = Math.min(Math.max(player.health, 0), 100);
    player.smarts = Math.min(Math.max(player.smarts, 0), 100);
    player.looks = Math.min(Math.max(player.looks, 0), 100);
    player.happiness = Math.min(Math.max(player.happiness, 0), 100);
  }

  updateLeaderboard(): void {
    if (!this.gameState) return;
    this.leaderboard = [...this.gameState.players]
      .filter((player) => player.isAlive)
      .sort((a, b) => b.score - a.score)
      .map((player) => ({
        name: player.name,
        score: player.score,
      }));
  }

  closeModal(): void {
    this.isModalVisible = false;
  }
}
