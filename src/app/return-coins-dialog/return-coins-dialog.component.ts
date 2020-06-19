import { Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {GameboardComponent} from '@app/gameboard/gameboard.component';
import {GameService} from '@app/_services';

@Component({
  selector: 'app-return-coins-dialog-component',
  templateUrl: './return-coins-dialog.component.html',
  styleUrls: ['./return-coins-dialog.component.less']
})
export class ReturnCoinsDialogComponent {
  private tokensToGiveBack: string[];

  constructor(public dialogRef: MatDialogRef<GameboardComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private gameService: GameService) {
    this.tokensToGiveBack = [];
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  checkRemoveCoin(token: string, i: number, howMany: number) {
    if (this.data.tokenState[token] > 0) {
      this.tokensToGiveBack.push(token);
      this.data.tokenState[token] -= 1;
      if (this.tokensToGiveBack.length === howMany) {
        console.log('wtf');
        this.gameService.returnTokensToTable(this.tokensToGiveBack).subscribe(response => {
          console.log(response);
          this.dialogRef.close();
        });
      }
    }
  }
}


