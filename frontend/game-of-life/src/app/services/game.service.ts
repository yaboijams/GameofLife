import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes this service available app-wide
})
export class GameService {
  private apiUrl = 'http://localhost:5252/api/Game'; // Adjust URL as needed

  constructor(private http: HttpClient) {}

  // Start a new game
  startGame(playerNames: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/start`, playerNames);
  }

  // Roll dice
  rollDice(): Observable<any> {
    return this.http.post(`${this.apiUrl}/roll`, {});
  }

  // Get leaderboard
  getLeaderboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/leaderboard`);
  }
}
