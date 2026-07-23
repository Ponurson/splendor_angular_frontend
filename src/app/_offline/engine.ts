// Offline Splendor engine: a TypeScript port of the backend GameServiceImpl rules.
// legalActions() generates every playable move and applyAction() is the only way to
// execute one, so the human REST calls and the AI go through the same predicates.
import {Card} from '@app/_models/card';
import {Noble} from '@app/_models/noble';
import {CARDS, NOBLES} from './game-data';
import {GameAction, sameAction} from './game-action';
import {Observation} from './ai/computer-player';

export type Tok = 'DIAMOND' | 'EMERALD' | 'RUBY' | 'SAPPHIRE' | 'ONYX' | 'GOLD';
export const TOKENS: Tok[] = ['DIAMOND', 'EMERALD', 'RUBY', 'SAPPHIRE', 'ONYX', 'GOLD'];
export const COLORS: Tok[] = ['DIAMOND', 'EMERALD', 'RUBY', 'SAPPHIRE', 'ONYX'];

/** Saves with any other version are silently reset - they never break a new build. */
export const SCHEMA_VERSION = 2;

/** Injected randomness: Math.random in production, a seeded generator in tests. */
export type Rng = () => number;

// id 91 is the level-0 "empty slot" placeholder, same as in the backend
const PLACEHOLDER = CARDS.find(c => c.id === '91');

export interface OPlayer {
    playerId: string;
    playerName: string;
    kind: 'HUMAN' | 'COMPUTER';
    seat: number;
    points: number;
    tokens: Record<string, number>;
    cards: Card[];
    nobles: Noble[];
    cardsInHand: Card[];
}

export interface OState {
    schemaVersion: number;
    revision: number;
    deck: Card[];
    cardsOnTable: Card[];
    nobles: Noble[];
    tokens: Record<string, number>;
    players: OPlayer[];
    lastPlayerId: string;   // 'init' before the first move, 'endGame' when over
    // part of the saved state so a page refresh does not drop the player out of reserve mode
    reserveTime?: boolean;
}

export interface MoveResult {
    ok: boolean;
    message: string;
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const zeroTokens = (): Record<string, number> => TOKENS.reduce((m, t) => ({...m, [t]: 0}), {});
const total = (t: Record<string, number>) => TOKENS.reduce((s, k) => s + (t[k] || 0), 0);
const combos = <T>(list: T[], k: number): T[][] =>
    k === 0 ? [[]] : list.reduce((all, x, i) =>
        all.concat(combos(list.slice(i + 1), k - 1).map(rest => [x, ...rest])), [] as T[][]);

export function mapOfCards(p: OPlayer): Record<string, number> {
    const m = zeroTokens();
    p.cards.forEach(c => m[c.produces]++);
    return m;
}

/** Gold needed on top of tokens+cards to buy this card, or Infinity if unaffordable. */
export function deficit(card: Card, p: OPlayer): number {
    const cards = mapOfCards(p);
    const need = COLORS.reduce((sum, t) =>
        sum + Math.max(0, (card.cost[t] || 0) - (p.tokens[t] || 0) - cards[t]), 0);
    return need <= (p.tokens.GOLD || 0) ? need : Infinity;
}

export class OfflineGame {
    state: OState = null;

    constructor(private storageKey = 'offlineGame', private rng: Rng = Math.random) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const state = JSON.parse(saved);
            if (state && state.schemaVersion === SCHEMA_VERSION) {
                this.state = state;
            } else {
                // an incompatible local save is dropped; nothing else in localStorage is touched
                localStorage.removeItem(storageKey);
            }
        }
    }

    private save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    clear() {
        this.state = null;
        localStorage.removeItem(this.storageKey);
    }

    private pick<T>(list: T[]): T {
        return list[Math.floor(this.rng() * list.length)];
    }

    start(humanName: string, botCount: number) {
        const deck = CARDS.filter(c => c.level > 0).map(c => clone(c));
        const cardsOnTable: Card[] = [];
        for (const level of [1, 2, 3]) {
            for (let j = 0; j < 4; j++) {
                const card = this.pick(deck.filter(c => c.level === level));
                deck.splice(deck.indexOf(card), 1);
                cardsOnTable.push(card);
            }
        }
        // bot names stay unique even when the human logs in as "Computer 1"
        const bots = ['Computer 1', 'Computer 2', 'Computer 3', 'Computer 4']
            .filter(name => name !== humanName)
            .slice(0, Math.min(3, Math.max(1, botCount)));
        const players: OPlayer[] = [humanName, ...bots].map((name, i) => ({
            playerId: 'p' + (i + 1), playerName: name,
            kind: i === 0 ? 'HUMAN' : 'COMPUTER' as 'HUMAN' | 'COMPUTER',
            seat: 0, points: 0, tokens: zeroTokens(), cards: [], nobles: [], cardsInHand: []
        }));
        for (let i = players.length - 1; i > 0; i--) {   // Fisher-Yates: who starts is random
            const j = Math.floor(this.rng() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]];
        }
        players.forEach((p, i) => p.seat = i);
        const startTokens = players.length === 4 ? 7 : players.length + 2;
        const nobles = clone(NOBLES);
        this.state = {
            schemaVersion: SCHEMA_VERSION,
            revision: 0,
            deck,
            cardsOnTable,
            tokens: COLORS.reduce((m, t) => ({...m, [t]: startTokens}), {GOLD: 5}),
            nobles: Array.from({length: players.length + 1},
                () => nobles.splice(Math.floor(this.rng() * nobles.length), 1)[0]),
            players,
            lastPlayerId: 'init'
        };
        this.save();
    }

    get over(): boolean {
        return !this.state || this.state.lastPlayerId === 'endGame';
    }

    nextPlayer(): OPlayer {
        const {players, lastPlayerId} = this.state;
        if (lastPlayerId === 'init') {
            return players[0];
        }
        const i = players.findIndex(p => p.playerId === lastPlayerId);
        return i === -1 ? null : players[(i + 1) % players.length];
    }

    player(playerId: string): OPlayer {
        return this.state.players.find(p => p.playerId === playerId);
    }

    human(): OPlayer {
        return this.state.players.find(p => p.kind === 'HUMAN');
    }

    private debt(p: OPlayer): number {
        return Math.max(0, total(p.tokens) - 10);
    }

    /** Every legal move for this player right now; empty unless it is their turn. */
    legalActions(playerId: string): GameAction[] {
        if (!this.state || this.over) {
            return [];
        }
        const p = this.player(playerId);
        const active = this.nextPlayer();
        if (!p || !active || active.playerId !== playerId) {
            return [];
        }
        if (this.debt(p) > 0) {
            return this.returnCombos(p).map(tokens => ({type: 'RETURN_TOKENS' as 'RETURN_TOKENS', tokens}));
        }
        const actions: GameAction[] = [];
        [...p.cardsInHand, ...this.state.cardsOnTable]
            .filter(c => c.id !== PLACEHOLDER.id && deficit(c, p) !== Infinity)
            .forEach(c => actions.push({type: 'BUY', cardId: c.id}));
        COLORS.filter(t => this.state.tokens[t] > 3)
            .forEach(t => actions.push({type: 'TAKE_TWO', token: t}));
        const available = COLORS.filter(t => this.state.tokens[t] > 0);
        // the rules force taking as many distinct colours as the table still offers, up to 3
        combos(available, Math.min(3, available.length))
            .forEach(tokens => tokens.length && actions.push({type: 'TAKE_DIFFERENT', tokens}));
        if (p.cardsInHand.length < 3) {
            this.state.cardsOnTable.filter(c => c.id !== PLACEHOLDER.id)
                .forEach(c => actions.push({type: 'RESERVE_VISIBLE', cardId: c.id}));
            [1, 2, 3].filter(level => this.state.deck.some(c => c.level === level))
                .forEach(level => actions.push({type: 'RESERVE_DECK', level}));
        }
        if (!actions.length) {
            actions.push({type: 'PASS'});   // PASS is only legal when nothing else is
        }
        return actions;
    }

    /** Every exact way to give back the excess over 10 tokens. */
    private returnCombos(p: OPlayer): string[][] {
        const result: string[][] = [];
        const build = (i: number, left: number, acc: string[]) => {
            if (!left) {
                result.push([...acc]);
                return;
            }
            if (i >= TOKENS.length) {
                return;
            }
            for (let n = Math.min(p.tokens[TOKENS[i]] || 0, left); n >= 0; n--) {
                build(i + 1, left - n, acc.concat(new Array(n).fill(TOKENS[i])));
            }
        };
        build(0, this.debt(p), []);
        return result;
    }

    /** The single mutation entry point: atomic, validated, saved once. */
    applyAction(playerId: string, action: GameAction, expectedRevision?: number): MoveResult {
        if (!this.state) {
            return {ok: false, message: 'bad request'};
        }
        if (expectedRevision !== undefined && expectedRevision !== null &&
            expectedRevision !== this.state.revision) {
            return {ok: false, message: 'stale revision'};
        }
        if (!this.legalActions(playerId).some(a => sameAction(a, action))) {
            return {ok: false, message: 'bad request'};
        }
        const p = this.player(playerId);
        switch (action.type) {
            case 'TAKE_TWO':
                p.tokens[action.token] += 2;
                this.state.tokens[action.token] -= 2;
                break;
            case 'TAKE_DIFFERENT':
                action.tokens.forEach(t => {
                    p.tokens[t]++;
                    this.state.tokens[t]--;
                });
                break;
            case 'RETURN_TOKENS':
                action.tokens.forEach(t => {
                    p.tokens[t]--;
                    this.state.tokens[t]++;
                });
                break;
            case 'BUY':
                this.doBuy(p, action.cardId);
                break;
            case 'RESERVE_VISIBLE':
                this.doReserve(p, action.cardId);
                break;
            case 'RESERVE_DECK':
                this.doReserveFromDeck(p, action.level);
                break;
            case 'PASS':
                break;
        }
        return {ok: true, message: this.upkeep(p)};
    }

    /** End of action: claim a noble, hand over the turn, detect the end of the game. */
    private upkeep(p: OPlayer): string {
        // every completed action funnels through here, so this is the one place reserve mode ends
        this.state.reserveTime = false;
        this.state.revision++;
        if (this.debt(p) > 0) {
            this.save();
            return 'Give back tokens';   // the turn stays with p until the excess is returned
        }
        const owned = mapOfCards(p);
        const noble = this.state.nobles.find(n =>
            COLORS.every(t => owned[t] >= (n.cardCombination[t] || 0)));
        if (noble) {
            // ponytail: rules let the player pick among several nobles, no UI for that - grant the first
            this.state.nobles.splice(this.state.nobles.indexOf(noble), 1);
            p.nobles.push(noble);
            p.points += noble.points;
        }
        this.state.lastPlayerId = p.playerId;
        // a full round is played out: the game ends when the turn comes back to the first seat
        if (this.state.players.some(pl => pl.points >= 15) &&
            this.nextPlayer().playerId === this.state.players[0].playerId) {
            this.state.lastPlayerId = 'endGame';
        }
        this.save();
        return 'Operation Confirmed';
    }

    private doBuy(p: OPlayer, cardId: string) {
        const slot = this.state.cardsOnTable.findIndex(c => c.id === cardId);
        const inHand = p.cardsInHand.findIndex(c => c.id === cardId);
        const card = slot !== -1 ? this.state.cardsOnTable[slot] : p.cardsInHand[inHand];
        const owned = mapOfCards(p);
        COLORS.forEach(t => {
            const due = Math.max(0, (card.cost[t] || 0) - owned[t]);
            const paid = Math.min(due, p.tokens[t]);
            p.tokens[t] -= paid;
            this.state.tokens[t] += paid;
            p.tokens.GOLD -= due - paid;
            this.state.tokens.GOLD += due - paid;
        });
        p.cards.push(card);
        p.points += card.points;
        if (slot !== -1) {
            this.refill(slot, card.level);
        } else {
            p.cardsInHand.splice(inHand, 1);
        }
    }

    private doReserve(p: OPlayer, cardId: string) {
        const slot = this.state.cardsOnTable.findIndex(c => c.id === cardId);
        const card = this.state.cardsOnTable[slot];
        p.cardsInHand.push(card);
        this.takeGold(p);
        this.refill(slot, card.level);
    }

    private doReserveFromDeck(p: OPlayer, level: number) {
        const card = this.pick(this.state.deck.filter(c => c.level === level));
        this.state.deck.splice(this.state.deck.indexOf(card), 1);
        p.cardsInHand.push(card);
        this.takeGold(p);
    }

    private takeGold(p: OPlayer) {
        if (this.state.tokens.GOLD > 0) {
            this.state.tokens.GOLD--;
            p.tokens.GOLD++;
        }
    }

    /** Replaces a bought/reserved table slot from its deck, or with the placeholder. */
    private refill(slot: number, level: number) {
        const fromLevel = this.state.deck.filter(c => c.level === level);
        if (!fromLevel.length) {
            this.state.cardsOnTable[slot] = clone(PLACEHOLDER);
            return;
        }
        const card = this.pick(fromLevel);
        this.state.deck.splice(this.state.deck.indexOf(card), 1);
        this.state.cardsOnTable[slot] = card;
    }

    // ---- thin mapping of the backend REST contract onto applyAction ----

    gainTwo(token: string, playerId: string): string {
        return this.applyAction(playerId, {type: 'TAKE_TWO', token}).message;
    }

    gainMany(tokens: string[], playerId: string): string {
        return this.applyAction(playerId, {type: 'TAKE_DIFFERENT', tokens}).message;
    }

    returnTokens(tokens: string[], playerId: string): string {
        return this.applyAction(playerId, {type: 'RETURN_TOKENS', tokens}).message;
    }

    buy(cardId: string, playerId: string): string {
        return this.applyAction(playerId, {type: 'BUY', cardId}).message;
    }

    reserve(cardId: string, playerId: string): string {
        return this.applyAction(playerId, {type: 'RESERVE_VISIBLE', cardId}).message;
    }

    reserveFromDeck(level: number, playerId: string): string {
        return this.applyAction(playerId, {type: 'RESERVE_DECK', level}).message;
    }

    /** Clicking gold toggles reserve mode: the next card click reserves instead of buying,
     *  clicking gold again backs out - it is the only way to undo a misclick. */
    goldToken(playerId: string) {
        const p = this.state ? this.player(playerId) : null;
        const active = p && !this.over ? this.nextPlayer() : null;
        if (active && active.playerId === playerId && this.debt(p) === 0 && p.cardsInHand.length < 3) {
            this.state.reserveTime = !this.state.reserveTime;
            this.state.revision++;
            this.save();
        }
    }

    /** Shape expected by the Angular GameState model (backend GameStateWrapper). */
    fullState(viewerId: string) {
        const viewer = this.player(viewerId);
        const active = this.over ? null : this.nextPlayer();
        const isItMyTurn = !!active && !!viewer && active.playerId === viewerId;
        const reserveTime = isItMyTurn && !!this.state.reserveTime;
        const markClickable = (c: Card) =>
            ({...c, clickable: reserveTime ? c.id !== PLACEHOLDER.id : deficit(c, viewer) !== Infinity});
        return clone({
            cardsOnTable: isItMyTurn ? this.state.cardsOnTable.map(markClickable) : this.state.cardsOnTable,
            players: this.state.players.map(pl => ({
                playerName: pl.playerName,
                isComputer: pl.kind === 'COMPUTER',
                points: pl.points,
                tokens: pl.tokens,
                cardsOwnedShort: mapOfCards(pl),
                cards: pl.cards,
                nobles: pl.nobles,
                cardsInHand: pl.playerId === viewerId && isItMyTurn
                    ? pl.cardsInHand.map(markClickable) : pl.cardsInHand
            })),
            tokens: this.state.tokens,
            nobles: this.state.nobles,
            isItMyTurn,
            isItReserveTime: reserveTime,
            currentPlayerName: active ? active.playerName : null,
            revision: this.state.revision
        });
    }

    /** What the AI is allowed to see: public state plus its own hand. */
    observe(playerId: string): Observation {
        const p = this.player(playerId);
        return clone({
            me: {
                points: p.points,
                tokens: p.tokens,
                bonuses: mapOfCards(p),
                cardsInHand: p.cardsInHand,
                nobles: p.nobles
            },
            opponents: this.state.players.filter(o => o.playerId !== playerId).map(o => ({
                points: o.points,
                tokens: o.tokens,
                bonuses: mapOfCards(o),
                cardsInHandCount: o.cardsInHand.length
            })),
            cardsOnTable: this.state.cardsOnTable.filter(c => c.id !== PLACEHOLDER.id),
            bank: this.state.tokens,
            nobles: this.state.nobles
        });
    }
}
