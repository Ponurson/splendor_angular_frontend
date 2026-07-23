import {CARDS} from './game-data';
import {COLORS, OfflineGame, Rng, SCHEMA_VERSION, TOKENS} from './engine';
import {HeuristicComputerPlayer} from './ai/heuristic-computer-player';

/** Deterministic rng so shuffles and deals are reproducible. */
const lcg = (seed: number): Rng => () =>
    (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

describe('OfflineGame', () => {
    let game: OfflineGame;

    const newGame = (botCount = 2, seed = 1, human = 'me') => {
        localStorage.removeItem('test-game');
        const g = new OfflineGame('test-game', lcg(seed));
        g.start(human, botCount);
        return g;
    };
    const byName = (name: string, g = game) => g.state.players.find(p => p.playerName === name);
    /** Makes it `name`'s turn by pointing lastPlayerId at the previous seat. */
    const forceTurn = (name: string, g = game) => {
        const ps = g.state.players;
        const i = ps.findIndex(p => p.playerName === name);
        g.state.lastPlayerId = ps[(i + ps.length - 1) % ps.length].playerId;
    };
    const tokenTotal = (t: Record<string, number>) => TOKENS.reduce((s, k) => s + (t[k] || 0), 0);

    beforeEach(() => {
        game = newGame();
    });

    it('deals a legal starting table with stable ids and marked bots', () => {
        expect(game.state.cardsOnTable.length).toBe(12);
        expect(game.state.cardsOnTable.filter(c => c.level === 1).length).toBe(4);
        expect(game.state.nobles.length).toBe(4);
        COLORS.forEach(t => expect(game.state.tokens[t]).toBe(5));
        expect(game.state.tokens.GOLD).toBe(5);
        expect(new Set(game.state.players.map(p => p.playerId)).size).toBe(3);
        expect(game.state.players.filter(p => p.kind === 'HUMAN').map(p => p.playerName)).toEqual(['me']);
        expect(game.state.players.filter(p => p.kind === 'COMPUTER').length).toBe(2);
        expect(game.state.players.map(p => p.seat)).toEqual([0, 1, 2]);
        expect(game.state.revision).toBe(0);
    });

    it('shuffles the seating so a bot can be the first player', () => {
        const firstSeats = [1, 2, 3, 4, 5, 6, 7, 8].map(seed => newGame(2, seed).state.players[0].kind);
        expect(firstSeats).toContain('COMPUTER');
        expect(firstSeats).toContain('HUMAN');
    });

    it('keeps names unique when the human logs in as a bot name', () => {
        const g = newGame(3, 1, 'Computer 1');
        expect(new Set(g.state.players.map(p => p.playerName)).size).toBe(4);
        expect(g.state.players.filter(p => p.kind === 'HUMAN').length).toBe(1);
    });

    it('rejects taking two tokens from a pile of three or fewer', () => {
        forceTurn('me');
        game.state.tokens.RUBY = 3;
        const me = byName('me').playerId;
        expect(game.gainTwo('RUBY', me)).toBe('bad request');
        expect(game.gainTwo('DIAMOND', byName('Computer 1').playerId)).toBe('bad request'); // not their turn
        expect(game.gainTwo('DIAMOND', me)).toBe('Operation Confirmed');
        expect(byName('me').tokens.DIAMOND).toBe(2);
        expect(game.state.tokens.DIAMOND).toBe(3);
    });

    it('forces taking exactly as many distinct colours as are available', () => {
        forceTurn('me');
        const me = byName('me').playerId;
        COLORS.forEach(t => game.state.tokens[t] = 0);
        game.state.tokens.DIAMOND = 1;
        game.state.tokens.EMERALD = 1;
        expect(game.gainMany(['DIAMOND'], me)).toBe('bad request');
        expect(game.gainMany(['DIAMOND', 'DIAMOND'], me)).toBe('bad request');
        expect(game.gainMany(['DIAMOND', 'EMERALD'], me)).toBe('Operation Confirmed');
    });

    it('makes an over-limit player return exactly the excess before the turn passes', () => {
        const me = byName('me');
        COLORS.forEach(t => me.tokens[t] = 2);
        forceTurn('me');
        expect(game.gainTwo('DIAMOND', me.playerId)).toBe('Give back tokens');
        expect(game.nextPlayer().playerId).toBe(me.playerId);
        expect(game.legalActions(me.playerId).every(a => a.type === 'RETURN_TOKENS')).toBe(true);
        expect(game.returnTokens(['DIAMOND'], me.playerId)).toBe('bad request'); // debt is 2
        expect(game.returnTokens(['DIAMOND', 'ONYX'], me.playerId)).toBe('Operation Confirmed');
        expect(game.nextPlayer().playerId).not.toBe(me.playerId);
        expect(tokenTotal(me.tokens)).toBe(10);
    });

    it('buys from the table, pays with gold as a joker and refills the slot', () => {
        forceTurn('me');
        const me = byName('me');
        const card = game.state.cardsOnTable[0];
        COLORS.forEach(t => me.tokens[t] = Math.max(0, (card.cost[t] || 0) - 1));
        me.tokens.GOLD = COLORS.filter(t => (card.cost[t] || 0) > 0).length;
        expect(game.buy(card.id, me.playerId)).toBe('Operation Confirmed');
        expect(me.cards.map(c => c.id)).toContain(card.id);
        expect(me.points).toBe(card.points);
        expect(game.state.cardsOnTable.length).toBe(12);
        expect(game.state.cardsOnTable.map(c => c.id)).not.toContain(card.id);
    });

    it('buys a reserved card from the hand', () => {
        forceTurn('me');
        const me = byName('me');
        const card = JSON.parse(JSON.stringify(
            CARDS.find(c => c.level === 1 && !game.state.cardsOnTable.some(t => t.id === c.id))));
        me.cardsInHand.push(card);
        COLORS.forEach(t => me.tokens[t] = card.cost[t] || 0);
        expect(game.buy(card.id, me.playerId)).toBe('Operation Confirmed');
        expect(me.cardsInHand.length).toBe(0);
        expect(me.cards.map(c => c.id)).toContain(card.id);
    });

    it('reserves from the table and from the deck, even with an empty gold pile', () => {
        forceTurn('me');
        const me = byName('me');
        game.state.tokens.GOLD = 0;
        expect(game.reserve(game.state.cardsOnTable[0].id, me.playerId)).toBe('Operation Confirmed');
        expect(me.cardsInHand.length).toBe(1);
        expect(me.tokens.GOLD).toBe(0);
        forceTurn('me');
        game.state.tokens.GOLD = 1;
        expect(game.reserveFromDeck(2, me.playerId)).toBe('Operation Confirmed');
        expect(me.cardsInHand.length).toBe(2);
        expect(me.tokens.GOLD).toBe(1);
        expect(me.cardsInHand[1].level).toBe(2);
    });

    it('caps reservations at three cards in hand', () => {
        forceTurn('me');
        const me = byName('me');
        me.cardsInHand = [0, 1, 2].map(() => ({id: 'x', level: 1, points: 0, cost: {DIAMOND: 9}} as any));
        expect(game.reserve(game.state.cardsOnTable[0].id, me.playerId)).toBe('bad request');
        expect(game.reserveFromDeck(1, me.playerId)).toBe('bad request');
        expect(game.legalActions(me.playerId).some(a =>
            a.type === 'RESERVE_VISIBLE' || a.type === 'RESERVE_DECK')).toBe(false);
    });

    it('grants a noble once the produced cards cover the combination', () => {
        forceTurn('me');
        const me = byName('me');
        const noble = game.state.nobles[0];
        Object.entries(noble.cardCombination).forEach(([t, n]) => {
            for (let i = 0; i < (n as number); i++) {
                me.cards.push({id: 'n' + t + i, level: 1, points: 0, produces: t, cost: {}} as any);
            }
        });
        expect(game.gainMany(['DIAMOND', 'EMERALD', 'RUBY'], me.playerId)).toBe('Operation Confirmed');
        expect(me.nobles).toEqual([noble]);
        expect(me.points).toBe(noble.points);
        expect(game.state.nobles.length).toBe(3);
    });

    it('offers PASS only when no other move is legal', () => {
        expect(game.legalActions(game.nextPlayer().playerId).some(a => a.type === 'PASS')).toBe(false);
        forceTurn('me');
        const me = byName('me');
        TOKENS.forEach(t => game.state.tokens[t] = 0);
        me.cardsInHand = [0, 1, 2].map(i => ({id: 'x' + i, level: 1, points: 0, cost: {DIAMOND: 9}} as any));
        expect(game.legalActions(me.playerId)).toEqual([{type: 'PASS'}]);
        expect(game.applyAction(me.playerId, {type: 'TAKE_TWO', token: 'DIAMOND'}).ok).toBe(false);
        expect(game.applyAction(me.playerId, {type: 'PASS'}).ok).toBe(true);
        expect(game.nextPlayer().playerId).not.toBe(me.playerId);
    });

    it('rejects an action carrying a stale revision', () => {
        forceTurn('me');
        const me = byName('me').playerId;
        const before = JSON.stringify(game.state);
        const result = game.applyAction(me, {type: 'TAKE_TWO', token: 'DIAMOND'}, game.state.revision - 1);
        expect(result).toEqual({ok: false, message: 'stale revision'});
        expect(JSON.stringify(game.state)).toBe(before);
        expect(game.applyAction(me, {type: 'TAKE_TWO', token: 'DIAMOND'}, game.state.revision).ok).toBe(true);
    });

    it('keeps reserve mode across a reload and drops it once the card is reserved', () => {
        forceTurn('me');
        const me = byName('me').playerId;
        game.goldToken(me);
        // a reload rebuilds the engine from localStorage, exactly what a page refresh does
        const reloaded = new OfflineGame('test-game');
        const state = reloaded.fullState(me);
        expect(state.isItMyTurn).toBe(true);
        expect(state.isItReserveTime).toBe(true);
        // in reserve mode every real card is pickable, not just the affordable ones
        expect(state.cardsOnTable.every(c => c.clickable || c.id === '91')).toBe(true);

        expect(reloaded.reserve(reloaded.state.cardsOnTable[0].id, me)).toBe('Operation Confirmed');
        expect(new OfflineGame('test-game').state.reserveTime).toBe(false);
    });

    it('lets a second gold click cancel reserve mode without spending the turn', () => {
        forceTurn('me');
        const me = byName('me').playerId;
        game.goldToken(me);
        game.goldToken(me);
        const state = game.fullState(me);
        expect(state.isItReserveTime).toBe(false);
        expect(state.isItMyTurn).toBe(true); // cancelling is not a move, the turn stays
        expect(state.cardsOnTable.some(c => !c.clickable)).toBe(true);
    });

    it('does not leak reserve mode or hidden state to the waiting players', () => {
        forceTurn('me');
        game.goldToken(byName('me').playerId);
        expect(game.fullState(byName('Computer 1').playerId).isItReserveTime).toBe(false);
        const observed = game.observe(byName('Computer 1').playerId);
        expect((observed as any).deck).toBeUndefined();
        expect(observed.opponents.every(o => (o as any).cardsInHand === undefined)).toBe(true);
        expect(observed.opponents.some(o => o.cardsInHandCount !== undefined)).toBe(true);
    });

    it('marks bots and the current player in the full state', () => {
        const state = game.fullState(byName('me').playerId);
        expect(state.players.filter(p => p.isComputer).length).toBe(2);
        expect(state.currentPlayerName).toBe(game.nextPlayer().playerName);
        expect(state.revision).toBe(game.state.revision);
    });

    it('drops a save with a foreign schema version without touching anything else', () => {
        localStorage.setItem('test-game', JSON.stringify({schemaVersion: SCHEMA_VERSION - 1, players: []}));
        localStorage.setItem('user', '{"username":"keep-me"}');
        const g = new OfflineGame('test-game');
        expect(g.state).toBeNull();
        expect(localStorage.getItem('test-game')).toBeNull();
        expect(localStorage.getItem('user')).toBe('{"username":"keep-me"}');
        localStorage.removeItem('user');
    });

    it('plays seeded full games for 2, 3 and 4 players preserving every resource', () => {
        const ai = new HeuristicComputerPlayer();
        [1, 2, 3].forEach(botCount => {
            const g = newGame(botCount, 100 + botCount, 'Human');
            const startTokens = {...g.state.tokens};
            expect(g.state.players.length).toBe(botCount + 1);
            let turns = 0;
            while (!g.over && turns++ < 400) {
                const active = g.nextPlayer();
                // the human seat plays with the same heuristic, purely to drive the simulation
                for (let step = 0; step < 4; step++) {
                    const current = g.over ? null : g.nextPlayer();
                    if (!current || current.playerId !== active.playerId) {
                        break;
                    }
                    const legal = g.legalActions(current.playerId);
                    const action = ai.chooseAction({
                        observation: g.observe(current.playerId),
                        legalActions: legal,
                        seed: g.state.revision
                    });
                    expect(g.applyAction(current.playerId, action).ok).toBe(true);
                }
                TOKENS.forEach(t => {
                    const held = g.state.players.reduce((s, p) => s + p.tokens[t], 0);
                    expect(held + g.state.tokens[t]).toBe(startTokens[t]);
                    expect(Math.min(g.state.tokens[t],
                        ...g.state.players.map(p => p.tokens[t]))).toBeGreaterThanOrEqual(0);
                });
                g.state.players.forEach(p => {
                    expect(tokenTotal(p.tokens)).toBeLessThanOrEqual(10);
                    expect(p.cardsInHand.length).toBeLessThanOrEqual(3);
                });
                const realCards = g.state.deck.length +
                    g.state.cardsOnTable.filter(c => c.id !== '91').length +
                    g.state.players.reduce((s, p) => s + p.cards.length + p.cardsInHand.length, 0);
                expect(realCards).toBe(90);
            }
            expect(g.over).toBe(true);
            expect(Math.max(...g.state.players.map(p => p.points))).toBeGreaterThanOrEqual(15);
        });
    });
});
