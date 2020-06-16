import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {User, Invitation, GameState} from '@app/_models';
import {AccountService} from '@app/_services/account.service';


@Injectable({providedIn: 'root'})
export class GameService {
    private userSubject: BehaviorSubject<User>;
    public user: User;
    private tokenSum: number;
    private tokens: Record<string, number>;

    constructor(
        private router: Router,
        private http: HttpClient,
        private accountService: AccountService
    ) {
        // this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
        // this.user = this.userSubject.asObservable();
        this.user = this.accountService.userValue;
    }

    getGameState() {
        return this.http.get(`${environment.apiUrl}/game/getState`)
            .pipe(map(response => {
                type MyMapLikeType = Record<string, string>;
                const model: MyMapLikeType = {};
                Object.assign(model, response);
                return model;
            }));
    }

    getFullState() {
        return this.http.get<GameState>(`${environment.apiUrl}/game/getFullState`);
    }

    sendTwoTokens(token: string) {
        console.log(token);
        return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/gainTwoTokens`, (token));
    }

    sendThreeTokens(firstToken: string, secondToken: string, thirdToken: string) {
        return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/gainThreeTokens`, ({
            firstToken,
            secondToken,
            thirdToken
        }));
    }

    getCardFromTable(id: string, isItReserveTime: boolean) {
        if (!isItReserveTime) {
            return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/buyCard`, (id));
        }else {
            return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/reserveCard`, (id));
        }
    }

    sendMixedTokens(firstToken: string, secondToken: string) {
        return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/gainMixedTokens`, ({firstToken, secondToken}));
    }

    processTokenReturn() {
        return this.getFullState()
            .pipe(map(gameState => {
                const players = gameState.players;
                const currentPlayer = players.find(player => player.playerName === this.accountService.userValue.username);
                this.tokens = currentPlayer.tokens;
                this.tokenSum = 0;
                // tslint:disable-next-line:forin
                for (const tokensKey in this.tokens) {
                    this.tokenSum += this.tokens[tokensKey];
                }
                // console.log(this.tokenSum - 10);
                return {howMany: (this.tokenSum - 10), tokenState: this.tokens};
            }));
    }

    returnTokensToTable(tokensToGiveBack: any[]) {
        return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/returnTokensToTable`, (tokensToGiveBack));
    }

    sendGoldToken() {
        return this.http.post<GameState>(`${environment.apiUrl}/game/gainGoldToken`, (''));
    }

    reserveCardFromDeck(number1: number) {
        return this.http.post<Record<string, string>>(`${environment.apiUrl}/game/reserveCardFromDeck`, (number1));
    }
}
