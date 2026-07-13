import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GameService } from '@app/_services';

import { ReturnCoinsDialogComponent } from './return-coins-dialog.component';

describe('ReturnCoinsDialogComponent', () => {
  let component: ReturnCoinsDialogComponent;
  let fixture: ComponentFixture<ReturnCoinsDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnCoinsDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
        { provide: MAT_DIALOG_DATA, useValue: { howMany: 0, tokenState: {} } },
        { provide: GameService, useValue: { returnTokensToTable: () => ({ subscribe: () => {} }) } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnCoinsDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
