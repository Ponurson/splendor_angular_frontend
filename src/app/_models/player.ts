import {Card} from '@app/_models/card';
import {Noble} from '@app/_models/noble';

export class Player {
    playerName: string;
    isComputer: boolean;
    points: number;
    // purchased cards; the backend PlayerWrapper serialises this field as "cards"
    cards: Card[];
    nobles: Noble[];
    tokens: Record<string, number>;
    cardsOwnedShort: Record<string, number>;
    cardsInHand: Card[];
}
