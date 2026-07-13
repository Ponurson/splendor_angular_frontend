import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { GameEndDialogComponent } from './game-end-dialog.component';

describe('GameEndDialogComponent', () => {
  let component: GameEndDialogComponent;
  let fixture: ComponentFixture<GameEndDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GameEndDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameEndDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
