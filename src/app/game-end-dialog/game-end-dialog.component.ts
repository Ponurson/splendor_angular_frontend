import { Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {GameboardComponent} from '@app/gameboard/gameboard.component';
import {Player} from '@app/_models/player';

@Component({
  selector: 'app-game-end-dialog-component',
  templateUrl: './game-end-dialog.component.html',
  standalone: false,
  styleUrls: ['./game-end-dialog.component.less']
})
export class GameEndDialogComponent {

  /** Most points wins; ties broken by fewest purchased cards. */
  ranking: Player[];

  constructor(public dialogRef: MatDialogRef<GameboardComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.ranking = [...(data.players || [])].sort((a, b) =>
      b.points - a.points || this.cardCount(a) - this.cardCount(b));
  }

  cardCount(player: Player): number {
    return player.cardsOwned ? player.cardsOwned.length : 0;
  }

  /** Rules allow a shared win when points and card count both tie. */
  isWinner(player: Player): boolean {
    const best = this.ranking[0];
    return player.points === best.points && this.cardCount(player) === this.cardCount(best);
  }

}
