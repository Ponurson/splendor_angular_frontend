import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of } from 'rxjs';
import { AccountService, AlertService, GameService } from '@app/_services';

import { GameboardComponent } from './gameboard.component';

describe('GameboardComponent', () => {
  let component: GameboardComponent;
  let fixture: ComponentFixture<GameboardComponent>;
  let gameService: any;

  /** Table where only RUBY is left, with `rubies` in the pile. */
  const onlyRubiesLeft = (rubies: number) => ({
    isItMyTurn: true,
    isItReserveTime: false,
    firstToken: undefined,
    secondToken: undefined,
    thirdToken: undefined,
    tokens: { DIAMOND: 0, EMERALD: 0, SAPPHIRE: 0, ONYX: 0, GOLD: 0, RUBY: rubies }
  });

  beforeEach(waitForAsync(() => {
    gameService = {
      sendMixedTokens: jasmine.createSpy('sendMixedTokens').and.returnValue(of({})),
      sendTwoTokens: jasmine.createSpy('sendTwoTokens').and.returnValue(of({})),
      sendThreeTokens: jasmine.createSpy('sendThreeTokens').and.returnValue(of({})),
      advanceComputerTurn: jasmine.createSpy('advanceComputerTurn').and.returnValue(of({}))
    };
    TestBed.configureTestingModule({
      declarations: [ GameboardComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: AccountService, useValue: { userValue: { username: 'test' } } },
        { provide: AlertService, useValue: {} },
        { provide: HttpClient, useValue: {} },
        { provide: GameService, useValue: gameService },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameboardComponent);
    component = fixture.componentInstance;
    spyOn(component, 'fullState');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('waits for a second click when the last remaining colour still allows taking two', () => {
    component.gameStateLocal = onlyRubiesLeft(4) as any;

    component.checkAddCoin('RUBY', 0);
    expect(gameService.sendMixedTokens).not.toHaveBeenCalled();
    expect(component.canConfirmSingleToken).toBe(true);

    component.checkAddCoin('RUBY', 0);
    expect(gameService.sendTwoTokens).toHaveBeenCalledWith('RUBY');
  });

  it('lets the player confirm a single token from the last remaining colour', () => {
    component.gameStateLocal = onlyRubiesLeft(4) as any;

    component.checkAddCoin('RUBY', 0);
    component.confirmSingleToken();

    expect(gameService.sendTwoTokens).not.toHaveBeenCalled();
    expect(gameService.sendMixedTokens).toHaveBeenCalledWith('RUBY', undefined);
  });

  it('still auto-submits one token when the last remaining pile is too small for two', () => {
    component.gameStateLocal = onlyRubiesLeft(3) as any;

    component.checkAddCoin('RUBY', 0);

    expect(gameService.sendMixedTokens).toHaveBeenCalledWith('RUBY', undefined);
    expect(component.canConfirmSingleToken).toBe(false);
  });

  /** Full state where a bot named "Computer 1" is on the move. */
  const botOnTheMove = (revision: number) => ({
    currentPlayerName: 'Computer 1',
    revision,
    players: [
      { playerName: 'test', isComputer: false },
      { playerName: 'Computer 1', isComputer: true }
    ]
  }) as any;

  it('requests one bot turn per response, guarded against double polling', () => {
    const pending = new Subject<any>();
    gameService.advanceComputerTurn.and.returnValue(pending);

    (component as any).maybeAdvanceComputerTurn(botOnTheMove(7));
    (component as any).maybeAdvanceComputerTurn(botOnTheMove(7));   // duplicate poll

    expect(gameService.advanceComputerTurn).toHaveBeenCalledTimes(1);
    expect(gameService.advanceComputerTurn).toHaveBeenCalledWith(7);

    pending.next({ message: 'Operation Confirmed' });
    pending.complete();
    expect(component.botTurnInFlight).toBe(false);
  });

  it('never advances a turn while a human is on the move', () => {
    (component as any).maybeAdvanceComputerTurn({
      currentPlayerName: 'test',
      revision: 3,
      players: [{ playerName: 'test', isComputer: false }]
    } as any);

    expect(gameService.advanceComputerTurn).not.toHaveBeenCalled();
  });
});
