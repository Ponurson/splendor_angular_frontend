import {ComputerPlayer} from './ai/computer-player';
import {HeuristicComputerPlayer} from './ai/heuristic-computer-player';
import {runComputerTurn} from './computer-turn-runner';
import {COLORS, OfflineGame, Rng} from './engine';

const lcg = (seed: number): Rng => () =>
    (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

describe('runComputerTurn', () => {
    let game: OfflineGame;
    const ai = new HeuristicComputerPlayer();

    const bot = () => game.state.players.find(p => p.kind === 'COMPUTER');
    const human = () => game.state.players.find(p => p.kind === 'HUMAN');
    /** Points lastPlayerId at the seat before `p`, making it p's turn. */
    const forceTurn = (playerId: string) => {
        const ps = game.state.players;
        const i = ps.findIndex(p => p.playerId === playerId);
        game.state.lastPlayerId = ps[(i + ps.length - 1) % ps.length].playerId;
    };

    beforeEach(() => {
        localStorage.removeItem('runner-game');
        game = new OfflineGame('runner-game', lcg(5));
        game.start('me', 2);
    });

    it('plays exactly one complete turn and hands the move on', () => {
        const b = bot();
        forceTurn(b.playerId);
        const revision = game.state.revision;
        expect(runComputerTurn(game, ai, revision)).toBe('Operation Confirmed');
        expect(game.state.lastPlayerId).toBe(b.playerId);
        expect(game.nextPlayer().playerId).not.toBe(b.playerId);
        expect(game.state.revision).toBeGreaterThan(revision);
    });

    it('finishes the forced token return inside the same turn', () => {
        const b = bot();
        forceTurn(b.playerId);
        COLORS.forEach(t => b.tokens[t] = 2);   // 10 held: any take forces a return
        const scripted: ComputerPlayer = {
            chooseAction: ({legalActions}) =>
                legalActions.find(a => a.type === 'TAKE_DIFFERENT') || legalActions[0]
        };
        expect(runComputerTurn(game, scripted, game.state.revision)).toBe('Operation Confirmed');
        expect(COLORS.reduce((s, t) => s + b.tokens[t], 0) + b.tokens.GOLD).toBe(10);
        expect(game.nextPlayer().playerId).not.toBe(b.playerId);
    });

    it('is a no-op for a stale revision or a human turn', () => {
        forceTurn(bot().playerId);
        const before = JSON.stringify(game.state);
        expect(runComputerTurn(game, ai, game.state.revision - 1)).toBe('stale revision');
        expect(JSON.stringify(game.state)).toBe(before);

        forceTurn(human().playerId);
        expect(runComputerTurn(game, ai, game.state.revision)).toBe('bad request');
        expect(game.nextPlayer().playerId).toBe(human().playerId);
    });

    it('falls back to the first legal action when the AI misbehaves or throws', () => {
        const b = bot();
        forceTurn(b.playerId);
        const illegal: ComputerPlayer = {chooseAction: () => ({type: 'BUY', cardId: 'no-such-card'})};
        expect(runComputerTurn(game, illegal, game.state.revision)).toBe('Operation Confirmed');
        expect(game.state.lastPlayerId).toBe(b.playerId);

        forceTurn(b.playerId);
        const throwing: ComputerPlayer = {chooseAction: () => { throw new Error('boom'); }};
        expect(runComputerTurn(game, throwing, game.state.revision)).toBe('Operation Confirmed');
        expect(game.state.lastPlayerId).toBe(b.playerId);
    });

    it('advances one to three consecutive bots one call at a time', () => {
        localStorage.removeItem('runner-game');
        game = new OfflineGame('runner-game', lcg(5));
        game.start('me', 3);
        forceTurn(human().playerId);
        game.applyAction(human().playerId, game.legalActions(human().playerId)[0]);
        let botTurns = 0;
        while (!game.over && game.nextPlayer().kind === 'COMPUTER') {
            const acting = game.nextPlayer().playerId;
            expect(runComputerTurn(game, ai, game.state.revision)).toBe('Operation Confirmed');
            expect(game.state.lastPlayerId).toBe(acting);
            botTurns++;
        }
        expect(botTurns).toBe(3);
        expect(game.nextPlayer().playerId).toBe(human().playerId);
    });
});
