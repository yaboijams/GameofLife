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
  boardSize = 50;
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
    const players = ['Alice', 'Bob'];
    this.gameService.startGame(players).subscribe({
      next: (state) => {
        this.gameState = state;
        this.gameState.players.forEach((player: any) => {
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

    this.gameService.rollDice().subscribe({
      next: (state) => {
        this.gameState = state;
        const currentPlayer = this.gameState.players[this.gameState.turnIndex];

        // Handle board cycle and update years
        if (currentPlayer.position >= this.boardSize) {
          currentPlayer.position %= this.boardSize;
          currentPlayer.year += this.yearsPerCycle; // Add 5 years for every cycle
          currentPlayer.yearRange = this.getYearRange(currentPlayer.position);

          // Trigger life event on board cycle completion
          this.triggerLifeEvent();
        }

        this.handleCellEvents(currentPlayer);
        this.updateLeaderboard();
      },
      error: (err) => console.error('Error rolling dice:', err),
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
        condition: () => player.Smarts >= 75,
        event: 'You secured a high-paying career! +20 Happiness, +10 Health.',
        effect: () => {
          player.Happiness += 20;
          player.Health += 10;
        },
      },
      {
        condition: () => player.Looks >= 70,
        event: 'You became a model! +15 Happiness, +5 Smarts.',
        effect: () => {
          player.Happiness += 15;
          player.Smarts += 5;
        },
      },
      {
        condition: () => player.Health >= 80,
        event: 'You completed a marathon! +20 Smarts, +10 Looks.',
        effect: () => {
          player.Smarts += 20;
          player.Looks += 10;
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
        currentPlayer.Health = Math.max(currentPlayer.Health - 10, 0);
        break;
      case 'Smarts':
        currentPlayer.Smarts = Math.max(currentPlayer.Smarts - 10, 0);
        break;
      case 'Looks':
        currentPlayer.Looks = Math.max(currentPlayer.Looks - 10, 0);
        break;
      case 'Happiness':
        currentPlayer.Happiness = Math.max(currentPlayer.Happiness - 10, 0);
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
      currentPlayer.Happiness += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Smarts')) {
      currentPlayer.Smarts += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Looks')) {
      currentPlayer.Looks += eventDescription.includes('+') ? 10 : -10;
    }
    if (eventDescription.includes('Health')) {
      currentPlayer.Health += eventDescription.includes('+') ? 10 : -10;
    }

    this.capStats(currentPlayer);
  }

  capStats(player: any): void {
    player.Health = Math.min(Math.max(player.Health, 0), 100);
    player.Smarts = Math.min(Math.max(player.Smarts, 0), 100);
    player.Looks = Math.min(Math.max(player.Looks, 0), 100);
    player.Happiness = Math.min(Math.max(player.Happiness, 0), 100);
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
