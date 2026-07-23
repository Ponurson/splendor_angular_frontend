import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {LocalGameRuntime} from './local-game-runtime';

// Starts a "play vs computer" session: builds the local game, flips the game
// transport to the in-app backend and opens the board.
@Injectable({providedIn: 'root'})
export class LocalVsBotsGameService {
    private starting = false;

    constructor(private runtime: LocalGameRuntime, private router: Router) {}

    start({botCount}: {botCount: number}) {
        if (this.starting) {
            return;   // a double click starts one game, not two
        }
        this.starting = true;
        this.runtime.start(botCount);
        this.router.navigate(['game']).then(() => this.starting = false,
            () => this.starting = false);
    }
}
