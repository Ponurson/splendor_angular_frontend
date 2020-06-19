import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameEndDialogComponent } from './game-end-dialog.component';

describe('GameEndDialogComponent', () => {
  let component: GameEndDialogComponent;
  let fixture: ComponentFixture<GameEndDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameEndDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameEndDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
