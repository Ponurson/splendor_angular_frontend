import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
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
      getGameState: jasmine.createSpy('getGameState').and.returnValue(of({ state: 'init', revision: '0' })),
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

  it('loads the board state immediately instead of waiting for the first poll', fakeAsync(() => {
    component.ngOnInit();
    tick(0);

    expect(gameService.getGameState).toHaveBeenCalledTimes(1);
    expect(component.fullState).toHaveBeenCalledTimes(1);
    component.ngOnDestroy();
  }));

  it('returns to the lobby when there is no active game', () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    gameService.getFullState = jasmine.createSpy('getFullState').and.returnValue(of(null));
    (component.fullState as jasmine.Spy).and.callThrough();

    component.fullState();

    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('keeps an in-progress token choice when the same local revision finishes syncing', () => {
    component.gameStateLocal = {
      revision: 7,
      firstToken: 'EMERALD'
    } as any;
    component.gameStateTemp = {
      revision: 7,
      firstToken: undefined
    } as any;

    component.animEnd(null);

    expect(component.gameStateLocal.firstToken).toBe('EMERALD');
  });

  it('applies a fetched state when it belongs to a newer local revision', () => {
    component.gameStateLocal = { revision: 7, firstToken: 'EMERALD' } as any;
    component.gameStateTemp = { revision: 8, firstToken: undefined } as any;

    component.animEnd(null);

    expect(component.gameStateLocal.revision).toBe(8);
    expect(component.gameStateLocal.firstToken).toBeUndefined();
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

  it('lets the player undo a selected colour when its pile cannot supply two', () => {
    component.gameStateLocal = {
      ...onlyRubiesLeft(3),
      tokens: { DIAMOND: 3, EMERALD: 3, SAPPHIRE: 3, ONYX: 3, GOLD: 0, RUBY: 3 }
    } as any;

    component.checkAddCoin('RUBY', 0);
    component.checkAddCoin('RUBY', 0);

    expect(component.gameStateLocal.firstToken).toBeUndefined();
    expect(gameService.sendMixedTokens).not.toHaveBeenCalled();
    expect(gameService.sendTwoTokens).not.toHaveBeenCalled();
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
    expect(component.fullState).toHaveBeenCalledTimes(1);
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
