import {HttpHandler, HttpRequest, HttpResponse} from '@angular/common/http';
import {of} from 'rxjs';

import {environment} from '@environments/environment';
import {GameModeService} from '@app/_services/game-mode.service';
import {LocalGameRuntime} from './local-game-runtime';
import {OfflineBackendInterceptor} from './offline-backend';

describe('OfflineBackendInterceptor', () => {
    let runtime: LocalGameRuntime;
    let interceptor: OfflineBackendInterceptor;

    const url = (path: string) => `${environment.apiUrl}${path}`;
    const nextHandler = () => ({handle: jasmine.createSpy('handle').and.returnValue(of(null))} as any as HttpHandler);
    const send = (request: HttpRequest<any>, next = nextHandler()) => {
        let body: any;
        interceptor.intercept(request, next)
            .subscribe(event => body = event instanceof HttpResponse ? event.body : undefined);
        return body;
    };

    beforeEach(() => {
        localStorage.setItem('user', JSON.stringify({username: 'tester', token: 't'}));
        localStorage.removeItem('gameMode.tester');
        localStorage.removeItem('offlineGame.tester');
        runtime = new LocalGameRuntime(new GameModeService());
        interceptor = new OfflineBackendInterceptor(runtime);
    });

    afterEach(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('gameMode.tester');
        localStorage.removeItem('offlineGame.tester');
    });

    it('passes everything through to Spring while no local session is active', () => {
        const next = nextHandler();
        send(new HttpRequest('GET', url('/game/getState')), next);
        send(new HttpRequest('GET', url('/userState')), next);
        expect((next.handle as jasmine.Spy).calls.count()).toBe(2);
    });

    it('answers game endpoints locally during a session, without touching Spring', () => {
        runtime.start(2);
        const next = nextHandler();
        const body = send(new HttpRequest('GET', url('/game/getFullState')), next);
        expect(next.handle).not.toHaveBeenCalled();
        expect(body.players.length).toBe(3);
        expect(body.players.filter(p => p.isComputer).length).toBe(2);
        // lobby traffic still belongs to Spring even mid-session
        send(new HttpRequest('GET', url('/userState')), next);
        expect(next.handle).toHaveBeenCalled();
    });

    it('keeps GET reads pure: polling never advances the game', () => {
        runtime.start(1);
        const before = JSON.stringify(runtime.game.state);
        send(new HttpRequest('GET', url('/game/getState')));
        send(new HttpRequest('GET', url('/game/getFullState')));
        send(new HttpRequest('GET', url('/game/getState')));
        expect(JSON.stringify(runtime.game.state)).toBe(before);
    });

    it('advances a bot turn only for the expected revision', () => {
        runtime.start(1);
        const game = runtime.game;
        game.state.lastPlayerId = game.human().playerId;   // make it the bot's turn
        const revision = game.state.revision;

        const stale = send(new HttpRequest('POST', url('/game/advanceComputerTurn'), {expectedRevision: revision - 1}));
        expect(stale.message).toBe('stale revision');
        expect(game.state.revision).toBe(revision);

        const fresh = send(new HttpRequest('POST', url('/game/advanceComputerTurn'), {expectedRevision: revision}));
        expect(fresh.message).toBe('Operation Confirmed');
        expect(game.state.revision).toBeGreaterThan(revision);
        // replaying the same request is a no-op
        const replay = send(new HttpRequest('POST', url('/game/advanceComputerTurn'), {expectedRevision: revision}));
        expect(replay.message).toBe('stale revision');
    });

    it('ends the session after the results screen and passes through again', () => {
        runtime.start(1);
        expect(runtime.active).toBe(true);
        send(new HttpRequest('GET', url('/game/hasSeenResults')));
        expect(runtime.active).toBe(false);
        expect(runtime.game.state).toBeNull();
        const next = nextHandler();
        send(new HttpRequest('GET', url('/game/getState')), next);
        expect(next.handle).toHaveBeenCalled();
    });

    it('emulates login and the lobby only in the offline build', () => {
        (environment as any).offline = true;
        try {
            expect(send(new HttpRequest('GET', url('/login'))).token).toBe('offline');
            expect(send(new HttpRequest('GET', url('/userState'))).state).toBe('idle');
            runtime.start(1);
            expect(send(new HttpRequest('GET', url('/userState'))).state).toBe('playing');
        } finally {
            (environment as any).offline = false;
        }
    });
});
