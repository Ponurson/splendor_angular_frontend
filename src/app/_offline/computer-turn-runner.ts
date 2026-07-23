// Plays exactly one complete computer turn: the main move plus any forced token
// return. Guarded by expectedRevision so a retried or double-polled request is a no-op.
import {ComputerPlayer} from './ai/computer-player';
import {GameAction} from './game-action';
import {OfflineGame} from './engine';

export function runComputerTurn(game: OfflineGame, ai: ComputerPlayer, expectedRevision?: number): string {
    if (!game.state || game.over) {
        return 'bad request';
    }
    if (expectedRevision !== undefined && expectedRevision !== null &&
        game.state.revision !== expectedRevision) {
        return 'stale revision';
    }
    const bot = game.nextPlayer();
    if (!bot || bot.kind !== 'COMPUTER') {
        return 'bad request';
    }
    // main move, then possibly the forced return; the guard only caps runaway loops
    for (let guard = 0; guard < 4; guard++) {
        const active = game.over ? null : game.nextPlayer();
        if (!active || active.playerId !== bot.playerId) {
            break;
        }
        const legal = game.legalActions(bot.playerId);
        let action: GameAction;
        try {
            action = ai.chooseAction({
                observation: game.observe(bot.playerId),
                legalActions: legal,
                seed: game.state.revision
            });
        } catch {
            action = legal[0];
        }
        if (!game.applyAction(bot.playerId, action).ok) {
            // an illegal AI decision must not stall the game: first legal action in stable order
            game.applyAction(bot.playerId, legal[0]);
        }
    }
    return 'Operation Confirmed';
}
