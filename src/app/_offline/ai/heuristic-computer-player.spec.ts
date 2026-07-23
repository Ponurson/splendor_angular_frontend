import {GameAction} from '../game-action';
import {Observation} from './computer-player';
import {HeuristicComputerPlayer} from './heuristic-computer-player';

describe('HeuristicComputerPlayer', () => {
    const ai = new HeuristicComputerPlayer();
    const zero = () => ({DIAMOND: 0, EMERALD: 0, RUBY: 0, SAPPHIRE: 0, ONYX: 0, GOLD: 0});
    const observation = (over: Partial<Observation> = {}): Observation => ({
        me: {points: 0, tokens: zero(), bonuses: zero(), cardsInHand: [], nobles: []},
        opponents: [],
        cardsOnTable: [],
        bank: {DIAMOND: 4, EMERALD: 4, RUBY: 4, SAPPHIRE: 4, ONYX: 4, GOLD: 5},
        nobles: [],
        ...over
    });
    const card = (id: string, points: number, cost: Record<string, number>) =>
        ({id, points, cost, produces: 'RUBY', level: 1} as any);

    it('prefers buying, and buys the most valuable affordable card', () => {
        const o = observation({cardsOnTable: [card('cheap', 0, {}), card('big', 4, {RUBY: 2})]});
        o.me.tokens.RUBY = 2;
        const actions: GameAction[] = [
            {type: 'TAKE_DIFFERENT', tokens: ['DIAMOND', 'EMERALD', 'RUBY']},
            {type: 'RESERVE_VISIBLE', cardId: 'big'},
            {type: 'BUY', cardId: 'cheap'},
            {type: 'BUY', cardId: 'big'}
        ];
        expect(ai.chooseAction({observation: o, legalActions: actions, seed: 0}))
            .toEqual({type: 'BUY', cardId: 'big'});
    });

    it('returns the least useful colour and keeps gold', () => {
        const o = observation();
        o.me.bonuses.RUBY = 2;   // rubies are already produced by cards, the token is worth least
        const actions: GameAction[] = [
            {type: 'RETURN_TOKENS', tokens: ['GOLD']},
            {type: 'RETURN_TOKENS', tokens: ['SAPPHIRE']},
            {type: 'RETURN_TOKENS', tokens: ['RUBY']}
        ];
        expect(ai.chooseAction({observation: o, legalActions: actions, seed: 0}))
            .toEqual({type: 'RETURN_TOKENS', tokens: ['RUBY']});
    });

    it('takes the tokens that shorten the distance to a valuable card', () => {
        const o = observation({cardsOnTable: [card('goal', 4, {ONYX: 3})]});
        const actions: GameAction[] = [
            {type: 'TAKE_DIFFERENT', tokens: ['DIAMOND', 'EMERALD', 'RUBY']},
            {type: 'TAKE_DIFFERENT', tokens: ['ONYX', 'DIAMOND', 'EMERALD']}
        ];
        expect(ai.chooseAction({observation: o, legalActions: actions, seed: 0}))
            .toEqual({type: 'TAKE_DIFFERENT', tokens: ['ONYX', 'DIAMOND', 'EMERALD']});
    });

    it('always answers with one of the offered actions, deterministically for a seed', () => {
        const o = observation({cardsOnTable: [card('a', 1, {RUBY: 1}), card('b', 1, {ONYX: 1})]});
        const actions: GameAction[] = [
            {type: 'RESERVE_VISIBLE', cardId: 'a'},
            {type: 'RESERVE_VISIBLE', cardId: 'b'},
            {type: 'RESERVE_DECK', level: 1}
        ];
        const first = ai.chooseAction({observation: o, legalActions: actions, seed: 7});
        expect(actions).toContain(first);
        expect(ai.chooseAction({observation: o, legalActions: actions, seed: 7})).toEqual(first);
    });
});
