import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {User, Invitation, GameState} from '@app/_models';


@Injectable({providedIn: 'root'})
export class GameService {
    private userSubject: BehaviorSubject<User>;
    public user: Observable<User>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
        this.user = this.userSubject.asObservable();
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
}
