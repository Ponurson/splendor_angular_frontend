import {Card} from '@app/_models/card';
import {Noble} from '@app/_models/noble';

export class Player {
    playerName: string;
    points: number;
    cardsOwned: Card[];
    nobles: Noble[];
    tokens: Record<string, number>;
    cardsOwnedShort: Record<string, number>;
}
