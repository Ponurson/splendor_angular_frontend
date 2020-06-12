import {Card} from '@app/_models/card';

export class Player {
    playerName: string;
    points: number;
    cardsOwned: Card[];
    tokens: Record<string, number>;
    cardsOwnedShort: Record<string, number>;
}
