import { Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {GameboardComponent} from '@app/gameboard/gameboard.component';

@Component({
  selector: 'app-game-end-dialog-component',
  templateUrl: './game-end-dialog.component.html',
  styleUrls: ['./game-end-dialog.component.less']
})
export class GameEndDialogComponent {


  constructor(public dialogRef: MatDialogRef<GameboardComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) { }

}
