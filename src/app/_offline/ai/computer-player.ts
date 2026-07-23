// The whole AI seam: a computer player only scores actions the engine generated.
// It never mutates state and never sees the deck order or other players' hands.
import {Card} from '@app/_models/card';
import {Noble} from '@app/_models/noble';
import {GameAction} from '../game-action';

/** Public information plus the bot's own holdings - nothing hidden leaks in here. */
export interface Observation {
    me: {
        points: number;
        tokens: Record<string, number>;
        bonuses: Record<string, number>;
        cardsInHand: Card[];
        nobles: Noble[];
    };
    opponents: {
        points: number;
        tokens: Record<string, number>;
        bonuses: Record<string, number>;
        cardsInHandCount: number;
    }[];
    cardsOnTable: Card[];
    bank: Record<string, number>;
    nobles: Noble[];
}

export interface ComputerPlayer {
    /** Must return one of legalActions; anything else is replaced by a deterministic legal fallback. */
    chooseAction(input: {observation: Observation, legalActions: GameAction[], seed: number}): GameAction;
}
