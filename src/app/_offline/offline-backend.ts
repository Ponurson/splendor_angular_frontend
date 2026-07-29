// Serves the game API from inside the app. Two jobs:
//  - every build: when a "play vs computer" session is active, the /game/* endpoints
//    are answered locally and nothing reaches Spring; otherwise requests pass through;
//  - the offline (Android) build additionally emulates login and the lobby, so the
//    app works with no backend at all.
import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, of} from 'rxjs';

import {environment} from '@environments/environment';
import {LocalGameRuntime} from './local-game-runtime';

@Injectable()
export class OfflineBackendInterceptor implements HttpInterceptor {

    constructor(private runtime: LocalGameRuntime) {}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (!request.url.startsWith(environment.apiUrl)) {
            return next.handle(request);
        }
        const path = request.url.slice(environment.apiUrl.length);
        if (environment.offline) {
            return of(new HttpResponse({status: 200, body: this.handleOffline(path, request.body)}));
        }
        if (path.startsWith('/game/') && this.runtime.active) {
            return of(new HttpResponse({status: 200, body: this.handleGame(path, request.body)}));
        }
        return next.handle(request);
    }

    private handleGame(path: string, body: any): any {
        const game = this.runtime.game;
        // the session owner is the one human seat, never resolved by name
        const me = game.state ? game.human().playerId : null;
        switch (path) {
            case '/game/getState':   // pure read: bot turns only advance via advanceComputerTurn
                // revision too: a bot answers in the same tick as the human move, so lastPlayerId
                // reads the same before and after and the poll would see no change at all
                return {
                    state: game.state ? game.state.lastPlayerId : null,
                    revision: game.state ? String(game.state.revision) : null
                };
            case '/game/getFullState':   // pure read
                return game.state ? game.fullState(me) : null;
            case '/game/advanceComputerTurn':
                return {message: this.runtime.advanceComputerTurn(body ? body.expectedRevision : undefined)};
            case '/game/gainTwoTokens':
                return {message: game.gainTwo(body, me)};
            case '/game/gainThreeTokens':
            case '/game/gainMixedTokens':
                return {message: game.gainMany(Object.values(body).filter(t => !!t) as string[], me)};
            case '/game/buyCard':
                return {message: game.buy(String(body), me)};
            case '/game/reserveCard':
                return {message: game.reserve(String(body), me)};
            case '/game/reserveCardFromDeck':
                return {message: game.reserveFromDeck(Number(body), me)};
            case '/game/returnTokensToTable':
                return {message: game.returnTokens(body, me)};
            case '/game/gainGoldToken':
                game.goldToken(me);
                return game.state ? game.fullState(me) : null;
            case '/game/hasSeenResults':
                this.runtime.end();
                return {message: 'ok'};
            default:
                return null;
        }
    }

    /** Offline (Android) build only: no server exists, so login and the lobby are emulated. */
    private handleOffline(path: string, body: any): any {
        switch (path) {
            case '/login':
                // no account exists to check against, the typed name is just the player name
                return {token: 'offline'};
            case '/register':
            case '/homeInit':
            case '/veryStrangeLogout':
            case '/joinGame':
            case '/resignFromGame':
            case '/invite':
                return {message: 'ok'};
            case '/userList':
                return [];
            case '/userState':
                // 'playing' reopens the board after an app restart mid-game
                return {state: this.runtime.active ? 'playing' : 'idle'};
            default:
                return this.handleGame(path, body);
        }
    }
}

export const offlineBackendProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: OfflineBackendInterceptor,
    multi: true
};
