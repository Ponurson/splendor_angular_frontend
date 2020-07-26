import {
    AfterContentInit,
    AfterViewChecked,
    AfterViewInit,
    Component,
    ElementRef, OnChanges,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {first, flatMap, map, takeUntil} from 'rxjs/operators';
import {Card, GameState, User} from '@app/_models';

import {AccountService, AlertService, GameService} from '@app/_services';
import {interval, Subject} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ReturnCoinsDialogComponent} from '@app/return-coins-dialog/return-coins-dialog.component';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {GameEndDialogComponent} from '@app/game-end-dialog/game-end-dialog.component';
import {Animations} from '@app/animations/animations';

@Component({
    selector: 'app-gameboard',
    templateUrl: './gameboard.component.html',
    styleUrls: ['./gameboard.component.less'],
    animations: Animations
})
export class GameboardComponent implements OnInit{ // , AfterViewInit, OnChanges {
    user: User;
    lastPlayer: string;
    gameStateLocal: GameState;
    gameStateTemp: GameState;
    cardsInHand: Card[];
    private zeroTokens: number;
    private dialogRef: MatDialogRef<ReturnCoinsDialogComponent>;
    private dialogRef2: MatDialogRef<GameEndDialogComponent>;
    private unsubscribe$ = new Subject<void>();
    isDisabled: boolean;
    positionX: number;
    positionY: number;
    translateList: number[][][];
    hasCardBeenTaken: boolean[];
    hasTokenBeenTaken: Record<string, boolean>;
    hasNobleBeenTaken: boolean[];


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
        interval(2 * 1000)
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
                if (data.state !== this.lastPlayer) {
                    this.fullState();
                }
                this.lastPlayer = data.state;
            });
    }

    fullState() {
        this.hasCardBeenTaken.fill(false);
        this.hasTokenBeenTaken = {DIAMOND: false, EMERALD: false, GOLD: false, SAPPHIRE: false, RUBY: false, ONYX: false};
        this.hasNobleBeenTaken.fill(false);
        this.gameService.getFullState()
            .subscribe(gameState => {
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
                const currentPlayer = players.find(player => player.playerName === this.accountService.userValue.username);
                this.cardsInHand = currentPlayer.cardsInHand;
                this.gameStateTemp = gameState;
                if (this.gameStateLocal === undefined) {
                    this.gameStateLocal = this.gameStateTemp;
                }
            });
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

    checkAddCoin(token: string, i: number) {
        if (!this.gameStateLocal.isItReserveTime) {
            this.zeroTokens = 0;
            for (const tokensKey in this.gameStateLocal.tokens) {
                if (this.gameStateLocal.tokens[tokensKey] === 0) {
                    this.zeroTokens++;
                }
            }
            if (this.zeroTokens === 5) {
                this.gameService.sendMixedTokens(this.gameStateLocal.firstToken,
                    this.gameStateLocal.secondToken).subscribe(data => {
                    console.log(data);
                    if (data.message === 'Give back tokens') {
                        this.returnTokens();
                    }
                    this.fullState();
                });
            }
            if (this.gameStateLocal.isItMyTurn && this.gameStateLocal.tokens[token] > 0) {
                if (this.gameStateLocal.firstToken === undefined) {
                    this.gameStateLocal.firstToken = token;
                    if (this.zeroTokens === 4) {
                        this.gameService.sendMixedTokens(this.gameStateLocal.firstToken,
                            this.gameStateLocal.secondToken).subscribe(data => {
                            console.log(data);
                            if (data.message === 'Give back tokens') {
                                this.returnTokens();
                            }
                            this.fullState();
                        });
                    }
                } else if (this.gameStateLocal.firstToken === token &&
                    this.gameStateLocal.tokens[token] > 3) {
                    this.gameStateLocal.secondToken = token;
                    this.gameService.sendTwoTokens(token)
                        .subscribe(data => {
                            console.log(data);
                            if (data.message === 'Give back tokens') {
                                this.returnTokens();
                            }
                            this.fullState();
                        });
                } else if (this.gameStateLocal.firstToken !== token &&
                    this.gameStateLocal.secondToken === undefined) {
                    this.gameStateLocal.secondToken = token;
                    if (this.zeroTokens === 3) {
                        this.gameService.sendMixedTokens(this.gameStateLocal.firstToken,
                            this.gameStateLocal.secondToken).subscribe(data => {
                            console.log(data);
                            if (data.message === 'Give back tokens') {
                                this.returnTokens();
                            }
                            this.fullState();
                        });
                    }
                } else if (this.gameStateLocal.firstToken !== token &&
                    this.gameStateLocal.secondToken !== token &&
                    this.gameStateLocal.thirdToken === undefined) {
                    this.gameStateLocal.thirdToken = token;
                    this.gameService.sendThreeTokens(this.gameStateLocal.firstToken,
                        this.gameStateLocal.secondToken,
                        this.gameStateLocal.thirdToken)
                        .subscribe(data => {
                            console.log(data);
                            if (data.message === 'Give back tokens') {
                                this.returnTokens();
                            }
                            this.fullState();
                        });
                }
            }
        }
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
        if (this.gameStateLocal.isItMyTurn &&
            this.gameStateLocal.firstToken === undefined &&
            !this.gameStateLocal.isItReserveTime &&
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
                    this.alertService.info('Reserve card from table', {autoClose: true});
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
        this.gameStateLocal = this.gameStateTemp;
    }
}
