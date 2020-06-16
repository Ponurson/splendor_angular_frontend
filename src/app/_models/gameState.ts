import {Card} from '@app/_models/card';
import {Player} from '@app/_models/player';
import {Noble} from '@app/_models/noble';

export class GameState {
    cardsOnTable: Card[];
    players: Player[];
    tokens: Record<string, number>;
    nobles: Noble[];
    isItMyTurn: boolean;
    isItReserveTime: boolean;
    firstToken: string;
    secondToken: string;
    thirdToken: string;
}
