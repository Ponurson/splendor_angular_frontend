import {Component, OnInit} from '@angular/core';
import {first, flatMap} from 'rxjs/operators';
import {GameState, User} from '@app/_models';

import {AccountService, AlertService, GameService} from '@app/_services';
import {config, interval, Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {ReturnCoinsDialogComponent} from '@app/return-coins-dialog/return-coins-dialog.component';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';

@Component({
    selector: 'app-gameboard',
    templateUrl: './gameboard.component.html',
    styleUrls: ['./gameboard.component.less']
})
export class GameboardComponent implements OnInit {
    user: User;
    lastPlayer: string;
    gameStateLocal: GameState;
    private zeroTokens: number;


    constructor(private route: ActivatedRoute,
                private router: Router,
                private accountService: AccountService,
                private alertService: AlertService,
                private http: HttpClient,
                private gameService: GameService,
                private dialog: MatDialog) {
        this.user = this.accountService.userValue;
    }

    ngOnInit(): void {
        interval(2 * 1000)
            .pipe(
                flatMap(() => this.gameService.getGameState())
            )
            .subscribe(data => {
                console.log(data);
                if (data.state !== this.lastPlayer) {
                    this.gameService.getFullState()
                        .subscribe(gameState => {
                            console.log(gameState);
                            this.gameStateLocal = gameState;
                        });
                }
                this.lastPlayer = data.state;
            });
    }

    checkAddCoin(token: string, i: number) {
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
                    console.log('give back tokens');
                    const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                        width: '250px',
                        // data: {howmany: data.challenger}
                    });
                }
                this.gameService.getFullState()
                    .subscribe(gameState => {
                        console.log(gameState);
                        this.gameStateLocal = gameState;
                    });
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
                            console.log('give back tokens');
                            const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                                width: '250px',
                                // data: {howmany: data.challenger}
                            });
                        }
                        this.gameService.getFullState()
                            .subscribe(gameState => {
                                console.log(gameState);
                                this.gameStateLocal = gameState;
                            });
                    });
                }
            } else if (this.gameStateLocal.firstToken === token &&
                this.gameStateLocal.tokens[token] > 3) {
                this.gameStateLocal.secondToken = token;
                this.gameService.sendTwoTokens(token)
                    .subscribe(data => {
                        console.log(data);
                        if (data.message === 'Give back tokens') {
                            console.log('give back tokens');
                            const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                                width: '250px',
                                // data: {howmany: data.challenger}
                            });
                        }
                        this.gameService.getFullState()
                            .subscribe(gameState => {
                                console.log(gameState);
                                this.gameStateLocal = gameState;
                            });
                    });
            } else if (this.gameStateLocal.firstToken !== token &&
                this.gameStateLocal.secondToken === undefined) {
                this.gameStateLocal.secondToken = token;
                if (this.zeroTokens === 3) {
                    this.gameService.sendMixedTokens(this.gameStateLocal.firstToken,
                        this.gameStateLocal.secondToken).subscribe(data => {
                        console.log(data);
                        if (data.message === 'Give back tokens') {
                            console.log('give back tokens');
                            const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                                width: '250px',
                                // data: {howmany: data.challenger}
                            });
                        }
                        this.gameService.getFullState()
                            .subscribe(gameState => {
                                console.log(gameState);
                                this.gameStateLocal = gameState;
                            });
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
                            console.log('give back tokens');
                            const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                                width: '250px',
                                // data: {howmany: data.challenger}
                            });
                        }
                        this.gameService.getFullState()
                            .subscribe(gameState => {
                                console.log(gameState);
                                this.gameStateLocal = gameState;
                            });
                    });
            }
        }
    }

    checkAddCard(i: number) {
        if (this.gameStateLocal.cardsOnTable[i].clickable) {
            this.gameService.buyCardFromTable(this.gameStateLocal.cardsOnTable[i].id)
                .subscribe(data => {
                    console.log(data);
                    if (data.message === 'Give back tokens') {
                        console.log('give back tokens');
                        const dialogRef = this.dialog.open(ReturnCoinsDialogComponent, {
                            width: '250px',
                            // data: {howmany: data.challenger}
                        });
                    }
                    this.gameService.getFullState()
                        .subscribe(gameState => {
                            console.log(gameState);
                            this.gameStateLocal = gameState;
                        });
                });
        }
    }
}
