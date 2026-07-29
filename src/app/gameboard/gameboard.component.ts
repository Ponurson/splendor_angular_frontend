import {
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    Component,
    ElementRef, OnChanges,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {first, flatMap, map, takeUntil} from 'rxjs/operators';
import {Card, GameState, User} from '@app/_models';

import {AccountService, AlertService, GameService} from '@app/_services';
import {Observable, Subject, timer} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ReturnCoinsDialogComponent} from '@app/return-coins-dialog/return-coins-dialog.component';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {GameEndDialogComponent} from '@app/game-end-dialog/game-end-dialog.component';
import {Animations} from '@app/animations/animations';

@Component({
    selector: 'app-gameboard',
    templateUrl: './gameboard.component.html',
    standalone: false,
    styleUrls: ['./gameboard.component.less'],
    animations: Animations
})
export class GameboardComponent implements OnInit, OnDestroy {
    user: User;
    lastPlayer: string;
    gameStateLocal: GameState;
    gameStateTemp: GameState;
    cardsInHand: Card[] = [];
    private zeroTokens: number;
    private dialogRef: MatDialogRef<ReturnCoinsDialogComponent>;
    private dialogRef2: MatDialogRef<GameEndDialogComponent>;
    private unsubscribe$ = new Subject<void>();
    isDisabled: boolean;
    botTurnInFlight = false;
    positionX: number;
    positionY: number;
    translateList: number[][][];
    hasCardBeenTaken: boolean[];
    hasTokenBeenTaken: Record<string, boolean>;
    hasNobleBeenTaken: boolean[];
    private syncTimer: any;


    @ViewChildren('cardsDiv') cardsDiv: QueryList<ElementRef>;
    @ViewChildren('playersDiv') playersDiv: QueryList<ElementRef>;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private accountService: AccountService,
                private alertService: AlertService,
                private http: HttpClient,
                private gameService: GameService,
                private dialog: MatDialog) {
        this.user = this.accountService.userValue;
        this.isDisabled = false;
        this.translateList = new Array<Array<Array<number>>>();
        this.hasCardBeenTaken = new Array<boolean>(12).fill(false);
        this.hasNobleBeenTaken = new Array<boolean>(5).fill(false);
        this.hasTokenBeenTaken = {DIAMOND: false, EMERALD: false, GOLD: false, SAPPHIRE: false, RUBY: false, ONYX: false};
    }

    ngOnInit(): void {
        timer(0, 2 * 1000)
            .pipe(
                flatMap(() => this.gameService.getGameState()),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(data => {
                console.log(data);
                if (data.state === 'endGame') {
                    this.gameService.getFullState()
                        .subscribe(gameState => {
                            console.log(gameState);
                            this.gameStateLocal = gameState;
                            this.gameService.setHasSeenResults()
                                .subscribe(data2 => {
                                        console.log(data2);
                                        this.unsubscribe$.next();
                                        this.unsubscribe$.complete();
                                        this.dialogRef2 = this.dialog.open(GameEndDialogComponent, {
                                            width: '250px',
                                            data: {players: this.gameStateLocal.players}
                                        });
                                    }
                                );
                        });
                }
                // on endGame the block above already fetched the final state and closed the
                // session - another fullState() here would go to a game that no longer exists
                // revision is sent by the local vs-bots backend only; without it the token is
                // just lastPlayerId, which is what the Spring backend has always returned
                const changed = data.state + '|' + (data.revision || '');
                if (changed !== this.lastPlayer && data.state !== 'endGame') {
                    this.fullState();
                }
                this.lastPlayer = changed;
            });
    }

    fullState() {
        this.hasCardBeenTaken.fill(false);
        this.hasTokenBeenTaken = {DIAMOND: false, EMERALD: false, GOLD: false, SAPPHIRE: false, RUBY: false, ONYX: false};
        this.hasNobleBeenTaken.fill(false);
        this.gameService.getFullState()
            .subscribe(gameState => {
                if (!gameState) {
                    // A bookmarked/back-button /game route is valid while logged in even when
                    // neither a local nor an online game exists. The backend represents that as
                    // an empty response, so return to the lobby instead of rendering null.
                    this.unsubscribe$.next();
                    this.unsubscribe$.complete();
                    this.router.navigate(['/']);
                    return;
                }
                console.log(gameState);

                if (this.gameStateLocal !== undefined) {
                    this.getAnimationParams(); // czyli to działa to oznacza że on changes nie jest czymś koniecznym chyba, nie jest
                    for (let i = 0; i < this.gameStateLocal.cardsOnTable.length; i++) {
                        this.hasCardBeenTaken[i] = false;
                        if (this.gameStateLocal.cardsOnTable[i].graphic !==
                            gameState.cardsOnTable[i].graphic) {
                            this.hasCardBeenTaken[i] = true;
                        }
                    }
                    // tslint:disable-next-line:forin
                    for (const tokensKey in this.gameStateLocal.tokens) {
                        this.hasTokenBeenTaken[tokensKey] = false;
                        if (this.gameStateLocal.tokens[tokensKey] >
                            gameState.tokens[tokensKey]) {
                            this.hasTokenBeenTaken[tokensKey] = true;
                        }
                    }
                    for (let i = 0; i < this.gameStateLocal.nobles.length; i++) {
                        let nobleFlag = true;
                        for (let j = 0; j < gameState.nobles.length; j++) {
                            if (this.gameStateLocal.nobles[i].id === gameState.nobles[j].id){
                                nobleFlag = false;
                            }
                        }
                        this.hasNobleBeenTaken[i] = nobleFlag;
                    }
                }
                const players = gameState.players;
                const currentPlayer = players.find(player => player.playerName === this.accountService.userValue.username) || players[0];
                this.cardsInHand = currentPlayer ? currentPlayer.cardsInHand : [];
                this.gameStateTemp = gameState;
                if (this.gameStateLocal === undefined) {
                    this.gameStateLocal = this.gameStateTemp;
                }
                // The board renders gameStateLocal and animEnd() is what swaps the fresh state in.
                // A move that lights up no flag (returning tokens, buying from hand) or that lights
                // the same flags as the previous one produces no animation state change at all, so
                // .done never fires and the board would freeze on a stale state for good.
                clearTimeout(this.syncTimer);
                this.syncTimer = setTimeout(() => this.applyFetchedState(), 700);
                // a refresh mid "give back tokens" would otherwise leave the game stuck
                if (gameState.isItMyTurn && !this.dialogRef && currentPlayer &&
                    Object.values(currentPlayer.tokens).reduce((s, n) => s + n, 0) > 10) {
                    this.returnTokens();
                }
                this.maybeAdvanceComputerTurn(gameState);
            });
    }

    /** When a bot is on the move, ask the local backend for exactly one turn. The flag
     *  and the revision keep retries and double polling from playing it twice; the next
     *  poll animates the move and triggers the following bot, so bots play sequentially. */
    private maybeAdvanceComputerTurn(gameState: GameState) {
        const current = gameState.players.find(p => p.playerName === gameState.currentPlayerName);
        if (!current || !current.isComputer || this.botTurnInFlight) {
            return;
        }
        this.botTurnInFlight = true;
        this.gameService.advanceComputerTurn(gameState.revision)
            .subscribe(data => {
                    this.botTurnInFlight = false;
                    // The local bot has already committed its move. Read that state now instead
                    // of leaving the board on "Turn: Computer" until the next two-second poll.
                    if (data.message === 'Operation Confirmed' || data.message === 'stale revision') {
                        this.fullState();
                    }
                },
                () => this.botTurnInFlight = false);
    }

    returnTokens() {
        console.log('give back tokens');
        return this.gameService.processTokenReturn()
            .pipe(first())
            .subscribe(dataInside => {
                console.log(dataInside.howMany);
                this.dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                    // width: '250px',
                    data: {howMany: dataInside.howMany, tokenState: dataInside.tokenState}
                });
            });
    }

    private applyMove(move: Observable<Record<string, string>>) {
        move.subscribe(data => {
            console.log(data);
            if (data.message === 'Give back tokens') {
                this.returnTokens();
            }
            this.fullState();
        });
    }

    private sendMixed() {
        this.applyMove(this.gameService.sendMixedTokens(this.gameStateLocal.firstToken,
            this.gameStateLocal.secondToken));
    }

    checkAddCoin(token: string, i: number) {
        if (this.gameStateLocal.isItReserveTime) {
            return;
        }
        this.zeroTokens = 0;
        for (const tokensKey in this.gameStateLocal.tokens) {
            // gold is only gained by reserving, an empty gold pile must not shrink the "take tokens" count
            if (tokensKey !== 'GOLD' && this.gameStateLocal.tokens[tokensKey] === 0) {
                this.zeroTokens++;
            }
        }
        if (this.zeroTokens === 5) {
            this.sendMixed();
        }
        if (!this.gameStateLocal.isItMyTurn || !(this.gameStateLocal.tokens[token] > 0)) {
            return;
        }
        // Clicking the picked colour again drops it - the only way out of a misclick, since the
        // pick lives on the client until the whole move is submitted. A pile of 4+ keeps its
        // "click again to take two" meaning and is handled below.
        if (this.gameStateLocal.firstToken === token && this.gameStateLocal.secondToken === undefined &&
            !(this.gameStateLocal.tokens[token] > 3)) {
            this.gameStateLocal.firstToken = undefined;
            return;
        }
        if (this.gameStateLocal.firstToken === undefined) {
            this.gameStateLocal.firstToken = token;
            // Only one colour is left. A pile of 4+ still allows the "take two of one colour"
            // move, so do not submit the single token yet - wait for a second click on the same
            // pile, or for the confirm button (canConfirmSingleToken) to settle for just one.
            if (this.zeroTokens === 4 && !(this.gameStateLocal.tokens[token] > 3)) {
                this.sendMixed();
            }
        } else if (this.gameStateLocal.firstToken === token &&
            this.gameStateLocal.secondToken === undefined &&
            this.gameStateLocal.tokens[token] > 3) {
            this.gameStateLocal.secondToken = token;
            this.applyMove(this.gameService.sendTwoTokens(token));
        } else if (this.gameStateLocal.firstToken !== token &&
            this.gameStateLocal.secondToken === undefined) {
            this.gameStateLocal.secondToken = token;
            if (this.zeroTokens === 3) {
                this.sendMixed();
            }
        } else if (this.gameStateLocal.firstToken !== token &&
            this.gameStateLocal.secondToken !== token &&
            this.gameStateLocal.thirdToken === undefined) {
            this.gameStateLocal.thirdToken = token;
            this.applyMove(this.gameService.sendThreeTokens(this.gameStateLocal.firstToken,
                this.gameStateLocal.secondToken,
                this.gameStateLocal.thirdToken));
        }
    }

    /** True while a "take two of one colour" move is still possible but the player has only
     *  clicked once - the confirm button lets them settle for a single token instead. The pile
     *  check also keeps the button hidden once a small last pile has been auto-submitted. */
    get canConfirmSingleToken(): boolean {
        return this.gameStateLocal !== undefined &&
            this.zeroTokens === 4 &&
            this.gameStateLocal.isItMyTurn &&
            !this.gameStateLocal.isItReserveTime &&
            this.gameStateLocal.firstToken !== undefined &&
            this.gameStateLocal.secondToken === undefined &&
            this.gameStateLocal.tokens[this.gameStateLocal.firstToken] > 3;
    }

    confirmSingleToken() {
        if (!this.canConfirmSingleToken) {
            return;
        }
        const token = this.gameStateLocal.firstToken;
        // mirrors the two-token branch: setting secondToken records that this turn's move is sent
        this.gameStateLocal.secondToken = token;
        this.applyMove(this.gameService.sendMixedTokens(token, undefined));
    }

    checkAddCard(i: Card) {
        if (i.clickable) {
            this.isDisabled = true;
            this.gameService.getCardFromTable(i.id,
                this.gameStateLocal.isItReserveTime)
                .subscribe(data => {
                    console.log(data);
                    if (data.message === 'Give back tokens') {
                        this.returnTokens();
                    }
                    this.fullState();
                });
            this.isDisabled = false;
        }
    }

    checkAddGold(gold: string) {
        // no isItReserveTime guard: a second click is the way out of reserve mode
        if (this.gameStateLocal.isItMyTurn &&
            this.gameStateLocal.firstToken === undefined &&
            this.cardsInHand.length < 3) {
            this.gameStateLocal.firstToken = gold;
            this.gameService.sendGoldToken()
                .subscribe(gameState => {
                    console.log(gameState);

                    if (this.gameStateLocal !== undefined) {
                        for (let i2 = 0; i2 < this.gameStateLocal.cardsOnTable.length; i2++) {
                            this.hasCardBeenTaken[i2] = false;
                            if (this.gameStateLocal.cardsOnTable[i2].graphic !==
                                gameState.cardsOnTable[i2].graphic) {
                                this.hasCardBeenTaken[i2] = true;
                            }
                        }
                    }
                    this.gameStateTemp = gameState;
                    this.gameStateLocal = gameState;
                    this.alertService.info(gameState.isItReserveTime ?
                        'Reserve card from table' : 'Reserve cancelled', {autoClose: true});
                });
        }
    }

    checkReserveCardFromDeck(number1: number) {
        if (this.gameStateLocal.isItReserveTime) {
            this.gameService.reserveCardFromDeck(number1)
                .subscribe(data => {
                    console.log(data);
                    if (data.message === 'Give back tokens') {
                        this.returnTokens();
                    }
                    this.fullState();
                });
        }
    }

    getAnimationParams() {
        this.translateList = new Array<Array<Array<number>>>();
        this.playersDiv.forEach((divLarge: ElementRef) => {
            const {x, y} = divLarge.nativeElement.getBoundingClientRect();
            this.positionY = y;
            this.positionX = x;
            const tempArray = new Array<Array<number>>();
            this.cardsDiv.forEach((div: ElementRef) => {
                const {x, y} = div.nativeElement.getBoundingClientRect();
                tempArray.push([this.positionX - x, this.positionY - y]);
            });
            this.translateList.push(tempArray);
            console.log(this.translateList);
        });
    }

    giveTranslateX(cardNum: number) {
        const currentPlayerName = this.gameStateLocal.currentPlayerName;
        const playerNum = this.gameStateLocal.players.map(player => player.playerName).indexOf(currentPlayerName);
        return this.translateList[playerNum] !== undefined ? this.translateList[playerNum][cardNum][0] : 0;
    }

    giveTranslateY(cardNum: number) {
        const currentPlayerName = this.gameStateLocal.currentPlayerName;
        const playerNum = this.gameStateLocal.players.map(player => player.playerName).indexOf(currentPlayerName);
        return this.translateList[playerNum] !== undefined ? this.translateList[playerNum][cardNum][1] : 0;
    }

    animEnd($event: any) {
        this.applyFetchedState();
    }

    private applyFetchedState() {
        if (!this.gameStateTemp) {
            return;
        }
        // Local polling may fetch the same revision again while the player is choosing
        // several tokens. Replacing the object would erase firstToken/secondToken halfway
        // through the click sequence. Online states have no revision, so they still follow
        // the original animation-driven assignment.
        const currentRevision = this.gameStateLocal && this.gameStateLocal.revision;
        const fetchedRevision = this.gameStateTemp.revision;
        if (currentRevision !== undefined && currentRevision !== null &&
            fetchedRevision === currentRevision) {
            return;
        }
        this.gameStateLocal = this.gameStateTemp;
    }

    ngOnDestroy() {
        // leaving the board mid-game must stop the poll, or it keeps running (and opening
        // dialogs) over whatever page the user navigated to
        clearTimeout(this.syncTimer);
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
