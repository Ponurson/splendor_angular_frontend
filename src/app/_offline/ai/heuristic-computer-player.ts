import {Card} from '@app/_models/card';
import {GameAction} from '../game-action';
import {ComputerPlayer, Observation} from './computer-player';

const COLORS = ['DIAMOND', 'EMERALD', 'RUBY', 'SAPPHIRE', 'ONYX'];

// ponytail: one greedy heuristic, no difficulty levels - add scoring weights per level if ever needed.
// Category order is fixed: forced return, then buy, then take tokens, then reserve, then pass.
export class HeuristicComputerPlayer implements ComputerPlayer {

    chooseAction({observation, legalActions, seed}:
                     {observation: Observation, legalActions: GameAction[], seed: number}): GameAction {
        let best: GameAction[] = [legalActions[0]];
        let bestScore = -Infinity;
        for (const action of legalActions) {
            const score = this.score(action, observation);
            if (score > bestScore) {
                bestScore = score;
                best = [action];
            } else if (score === bestScore) {
                best.push(action);
            }
        }
        return best[Math.abs(seed) % best.length];
    }

    private score(action: GameAction, o: Observation): number {
        switch (action.type) {
            case 'BUY': {
                const card = this.card(o, action.cardId);
                // points and the permanent bonus first, then noble progress; spent gold is a cost
                return 3000 + card.points * 8 + this.nobleProgress(o, card) * 3 + 2
                    - this.goldNeeded(o, card) * 2;
            }
            case 'TAKE_TWO':
            case 'TAKE_DIFFERENT': {
                const taken = action.type === 'TAKE_TWO' ? [action.token, action.token] : action.tokens;
                const want = this.demand(o);
                return 2000 + taken.reduce((s, t) => s + want[t], 0) + taken.length * 0.1;
            }
            case 'RESERVE_VISIBLE': {
                const card = this.card(o, action.cardId);
                // a valuable card for later, better still if an opponent could buy it right now
                return 1000 + card.points + (this.opponentCanBuy(o, card) ? 2 : 0)
                    + (o.bank.GOLD > 0 ? 1 : 0);
            }
            case 'RESERVE_DECK':
                return 1000;
            case 'RETURN_TOKENS': {
                // give back what helps least: colours our cards already produce; gold is a joker, keep it
                const want = this.demand(o);
                return action.tokens.reduce((s, t) =>
                    s + (t === 'GOLD' ? -100 : (o.me.bonuses[t] || 0) * 2 - want[t]), 4000);
            }
            case 'PASS':
                return 0;
        }
    }

    /** How much each colour still shortens the distance to visible cards, weighted by their points. */
    private demand(o: Observation): Record<string, number> {
        const want: Record<string, number> = {DIAMOND: 0, EMERALD: 0, RUBY: 0, SAPPHIRE: 0, ONYX: 0, GOLD: 0};
        for (const card of [...o.cardsOnTable, ...o.me.cardsInHand]) {
            for (const t of COLORS) {
                want[t] += Math.max(0, (card.cost[t] || 0) - (o.me.bonuses[t] || 0) - (o.me.tokens[t] || 0))
                    * (1 + card.points);
            }
        }
        return want;
    }

    private card(o: Observation, cardId: string): Card {
        return [...o.cardsOnTable, ...o.me.cardsInHand].find(c => c.id === cardId)
            || {points: 0, cost: {}, produces: ''} as any as Card;
    }

    private goldNeeded(o: Observation, card: Card): number {
        return COLORS.reduce((s, t) =>
            s + Math.max(0, (card.cost[t] || 0) - (o.me.bonuses[t] || 0) - (o.me.tokens[t] || 0)), 0);
    }

    /** Nobles that still need more of this card's colour than the bot already produces. */
    private nobleProgress(o: Observation, card: Card): number {
        return o.nobles.reduce((s, n) =>
            s + ((n.cardCombination[card.produces] || 0) > (o.me.bonuses[card.produces] || 0) ? 1 : 0), 0);
    }

    private opponentCanBuy(o: Observation, card: Card): boolean {
        return o.opponents.some(op => COLORS.reduce((s, t) =>
            s + Math.max(0, (card.cost[t] || 0) - (op.bonuses[t] || 0) - (op.tokens[t] || 0)), 0)
            <= (op.tokens.GOLD || 0));
    }
}
