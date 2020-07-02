import {Component, OnInit} from '@angular/core';
import {first, flatMap, takeUntil} from 'rxjs/operators';
import {Card, GameState, User} from '@app/_models';

import {AccountService, AlertService, GameService} from '@app/_services';
import {interval, Subject} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ReturnCoinsDialogComponent} from '@app/return-coins-dialog/return-coins-dialog.component';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {GameEndDialogComponent} from '@app/game-end-dialog/game-end-dialog.component';

@Component({
    selector: 'app-gameboard',
    templateUrl: './gameboard.component.html',
    styleUrls: ['./gameboard.component.less']
})
export class GameboardComponent implements OnInit {
    user: User;
    lastPlayer: string;
    gameStateLocal: GameState;
    cardsInHand: Card[];
    private zeroTokens: number;
    private dialogRef: MatDialogRef<ReturnCoinsDialogComponent>;
    private dialogRef2: MatDialogRef<GameEndDialogComponent>;
    private unsubscribe$ = new Subject<void>();
    isDisabled: boolean;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private accountService: AccountService,
                private alertService: AlertService,
                private http: HttpClient,
                private gameService: GameService,
                private dialog: MatDialog) {
        this.user = this.accountService.userValue;
        this.isDisabled = false;
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
        return  this.gameService.getFullState()
            .subscribe(gameState => {
                console.log(gameState);
                this.gameStateLocal = gameState;
                const players = gameState.players;
                const currentPlayer = players.find(player => player.playerName === this.accountService.userValue.username);
                this.cardsInHand = currentPlayer.cardsInHand;
            });
    }

    returnTokens(){
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
}
