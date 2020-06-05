import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {User, Invitation} from '@app/_models';


@Injectable({providedIn: 'root'})
export class AccountService {
    private userSubject: BehaviorSubject<User>;
    public user: Observable<User>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.userSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('user')));
        this.user = this.userSubject.asObservable();
    }

    public get userValue(): User {
        return this.userSubject.value;
    }

    // login(username, password) {
    //     // const headers = new HttpHeaders({
    //     //     authorization : 'Basic ' + btoa(username + ':' + password)
    //     // });
    //
    //     return this.http.post<User>(`${environment.apiUrl}/user`, {username, password})
    //         .pipe(map(user => {
    //             // store user details and jwt token in local storage to keep user logged in between page refreshes
    //             // user.token = btoa(username + ':' + password);
    //             localStorage.setItem('user', JSON.stringify(user));
    //             this.userSubject.next(user);
    //             return user;
    //         }));
    // }

    login(username, password) {
        const headers = new HttpHeaders({
            Authorization: `Basic ` + btoa(username + ':' + password)
        });

        return this.http.get(`${environment.apiUrl}/login`, {headers})
            .pipe(map(response => {
                const user: User = {
                    id: 'test',
                    username,
                    password,
                    token: btoa(username + ':' + password)
                };
                localStorage.setItem('user', JSON.stringify(user));
                this.userSubject.next(user);
                return user;
            }));
    }

    logout() {
        // remove user from local storage and set current user to null
        localStorage.removeItem('user');
        this.userSubject.next(null);
        this.router.navigate(['/account/login']);
    }

    invite(invitation: Invitation) {
        return this.http.post(`${environment.apiUrl}/invite`, {invitation});
    }

    register(user: User) {
        return this.http.post(`${environment.apiUrl}/register`, user);
    }

    getAll() {
        return this.http.get<User[]>(`${environment.apiUrl}/users`);
    }

    getById(id: string) {
        return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
    }

    update(id, params) {
        return this.http.put(`${environment.apiUrl}/users/${id}`, params)
            .pipe(map(x => {
                // update stored user if the logged in user updated their own record
                // tslint:disable-next-line:triple-equals
                if (id == this.userValue.id) {
                    // update local storage
                    const user = {...this.userValue, ...params};
                    localStorage.setItem('user', JSON.stringify(user));

                    // publish updated user to subscribers
                    this.userSubject.next(user);
                }
                return x;
            }));
    }

    delete(id: string) {
        return this.http.delete(`${environment.apiUrl}/users/${id}`)
            .pipe(map(x => {
                // auto logout if the logged in user deleted their own record
                // tslint:disable-next-line:triple-equals
                if (id == this.userValue.id) {
                    this.logout();
                }
                return x;
            }));
    }

    getUserState() {
        return this.http.get(`${environment.apiUrl}/userState`).pipe(map(response =>{
            type MyMapLikeType = Record<string, string>;
            const model: MyMapLikeType = {};
            Object.assign(model, response);
            return model;
        }));
    }

    resignFromGame(data) {
        return this.http.post(`${environment.apiUrl}/resignFromGame`, data);
    }

    joinGame(data) {
        return this.http.post(`${environment.apiUrl}/joinGame`, data);
    }
}
