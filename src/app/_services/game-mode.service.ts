import {Injectable} from '@angular/core';

// Which transport the game endpoints use: 'local' plays against bots inside the app,
// anything else goes to the Spring backend. Scoped per user so modes never leak
// between accounts on a shared browser.
@Injectable({providedIn: 'root'})
export class GameModeService {

    private key(username: string): string {
        return `gameMode.${username || 'anonymous'}`;
    }

    isLocal(username: string): boolean {
        return localStorage.getItem(this.key(username)) === 'local';
    }

    setLocal(username: string) {
        localStorage.setItem(this.key(username), 'local');
    }

    clear(username: string) {
        localStorage.removeItem(this.key(username));
    }
}
