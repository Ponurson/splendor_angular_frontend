import {Card} from '@app/_models/card';

export class GameState {
    cardsOnTable: Card[];
    players: string[];
    // tokens: number[];
    tokens: Record<string, number>;
    isItMyTurn: boolean;
    firstToken: string;
    secondToken: string;
    thirdToken: string;
}
