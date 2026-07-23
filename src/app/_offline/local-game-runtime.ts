// The one shared local session. The interceptor, the start service and the UI all
// talk to this, so there is exactly one engine instance (and one localStorage save,
// scoped to the logged-in user) at a time.
import {Injectable} from '@angular/core';
import {GameModeService} from '@app/_services/game-mode.service';
import {HeuristicComputerPlayer} from './ai/heuristic-computer-player';
import {runComputerTurn} from './computer-turn-runner';
import {OfflineGame} from './engine';

@Injectable({providedIn: 'root'})
export class LocalGameRuntime {
    private engine: OfflineGame = null;
    private engineKey: string = null;
    private ai = new HeuristicComputerPlayer();

    constructor(private mode: GameModeService) {}

    private get username(): string {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        return user ? user.username : null;
    }

    /** Engine bound to the current user's save; swapped out when another user logs in. */
    get game(): OfflineGame {
        const key = `offlineGame.${this.username || 'anonymous'}`;
        if (this.engineKey !== key) {
            localStorage.removeItem('offlineGame');   // unversioned prototype save
            this.engine = new OfflineGame(key);
            this.engineKey = key;
        }
        return this.engine;
    }

    /** True while game traffic must stay local for the current user. */
    get active(): boolean {
        return this.mode.isLocal(this.username) && !!this.game.state;
    }

    start(botCount: number) {
        this.game.start(this.username || 'Player', botCount);
        this.mode.setLocal(this.username);
    }

    /** Called after the results screen: the session and the mode flag both end here. */
    end() {
        this.game.clear();
        this.mode.clear(this.username);
    }

    advanceComputerTurn(expectedRevision?: number): string {
        return runComputerTurn(this.game, this.ai, expectedRevision);
    }
}
