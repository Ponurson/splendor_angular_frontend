// Moves a player can make in the local game. The engine both generates them
// (legalActions) and validates them (applyAction), so human clicks and the AI
// run through exactly the same rules.
export type GameActionType =
    'TAKE_TWO' | 'TAKE_DIFFERENT' | 'BUY' | 'RESERVE_VISIBLE' | 'RESERVE_DECK' | 'RETURN_TOKENS' | 'PASS';

export interface GameAction {
    type: GameActionType;
    token?: string;      // TAKE_TWO
    tokens?: string[];   // TAKE_DIFFERENT, RETURN_TOKENS
    cardId?: string;     // BUY, RESERVE_VISIBLE
    level?: number;      // RESERVE_DECK
}

/** Structural equality; token order does not matter. */
export function sameAction(a: GameAction, b: GameAction): boolean {
    const key = (x: GameAction) => JSON.stringify(
        [x.type, x.token || '', x.cardId || '', x.level || 0, [...(x.tokens || [])].sort()]);
    return key(a) === key(b);
}
