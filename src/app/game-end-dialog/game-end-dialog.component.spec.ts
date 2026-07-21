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

describe('GameEndDialogComponent ranking', () => {
  const build = (players: any[]) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      declarations: [ GameEndDialogComponent ],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {}, disableClose: false } },
        { provide: MAT_DIALOG_DATA, useValue: { players } }
      ]
    });
    return TestBed.createComponent(GameEndDialogComponent).componentInstance;
  };

  const player = (playerName: string, points: number, cards: number) =>
    ({ playerName, points, cardsOwned: new Array(cards).fill({}) });

  it('sorts by points descending', () => {
    const c = build([player('a', 3, 5), player('b', 15, 9), player('c', 8, 2)]);
    expect(c.ranking.map(p => p.playerName)).toEqual(['b', 'c', 'a']);
    expect(c.isWinner(c.ranking[0])).toBe(true);
    expect(c.isWinner(c.ranking[1])).toBe(false);
  });

  it('breaks point ties by fewest purchased cards', () => {
    const c = build([player('a', 15, 12), player('b', 15, 10)]);
    expect(c.ranking.map(p => p.playerName)).toEqual(['b', 'a']);
    expect(c.isWinner(c.ranking[0])).toBe(true);
    expect(c.isWinner(c.ranking[1])).toBe(false);
  });

  it('marks a shared win when points and cards both tie', () => {
    const c = build([player('a', 15, 10), player('b', 15, 10)]);
    expect(c.ranking.every(p => c.isWinner(p))).toBe(true);
  });
});
