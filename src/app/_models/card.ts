export class Card {
    id: string;
    points: number;
    level: number;
    // diamondCost: number;
    // emeraldCost: number;
    // rubyCost: number;
    // saphireCost: number;
    // onyxCost: number;
    graphic: string;
    clickable: boolean;
    produces: string;
    cost: Record<string, number>;
}
