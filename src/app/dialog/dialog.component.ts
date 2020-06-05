import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {HomeComponent} from '@app/home';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dialog-component',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.less']
})
export class DialogComponent {

    constructor(
        public dialogRef: MatDialogRef<HomeComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
