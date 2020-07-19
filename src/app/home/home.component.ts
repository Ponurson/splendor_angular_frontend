import {User} from '@app/_models';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {first, flatMap, takeUntil} from 'rxjs/operators';
import {environment} from '@environments/environment';

import {AccountService, AlertService} from '@app/_services';
import {interval, Observable, Subject} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {DialogComponent} from '@app/dialog/dialog.component';

@Component({templateUrl: 'home.component.html'})
export class HomeComponent implements OnInit, OnDestroy {
    user: User;
    form: FormGroup;
    loading = false;
    submitted = false;
    status: string;
    private unsubscribe$ = new Subject<void>();
    userList: string[];

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService,
        private http: HttpClient,
        private dialog: MatDialog
    ) {
        this.user = this.accountService.userValue;
    }

    ngOnInit() {
        this.alertService.info('You can test the game by selecting yourself as Player1', {autoClose: true});

        this.accountService.homeInit().subscribe(data => {
            console.log(data);
        });
        this.form = this.formBuilder.group({
            player1: ['', Validators.required],
            player2: [''],
            player3: [''],
        });


        interval(2 * 1000)
            .pipe(
                flatMap(() => this.accountService.getUserState()),
                takeUntil(this.unsubscribe$)
            )
            .subscribe(data => {
                console.log(data);
                this.accountService.getUserList().subscribe(data2 => {
                    this.userList = data2;
                });
                if (data.state === 'idle' && this.loading === true) {
                    // racing conditions i to tutaj będzie bardzo źle
                    // trzeba to jakoś inaczej zrobić bo przecież nawet jeżeli na backendzie jest
                    // jest wszystko wporzo to tutaj sobie można zrobić krzywdę
                    this.loading = false;
                    this.alertService.info('no available players', {autoClose: true});
                } else if (data.state === 'playing' && status !== 'playing') {
                    this.unsubscribe$.next();
                    this.unsubscribe$.complete();
                    this.router.navigate(['game']);
                } else if (data.state === 'challenged' && status !== 'challenged') {
                    const dialogRef = this.dialog.open(DialogComponent, {
                        width: '250px',
                        data: {challenger: data.challenger}
                    });
                    dialogRef.afterClosed().subscribe(result => {
                        if (result === false) {
                            this.accountService.resignFromGame(data).pipe(first())
                                .subscribe(
                                    response => {
                                        console.log(response);
                                    },
                                    error => {
                                        this.alertService.error(error);
                                        this.loading = false;
                                    });
                        } else if (result === true) {
                            this.accountService.joinGame(data).pipe(first())
                                .subscribe(
                                    response => {
                                        console.log(response);
                                    },
                                    error => {
                                        this.alertService.error(error);
                                        this.loading = false;
                                    });
                        }
                    });
                }
                status = data.state;
            });
    }

    get f() {
        return this.form.controls;
    }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        this.accountService.invite(this.form.value)
            .pipe(first())
            .subscribe(
                data => {
                    console.log(data);
                },
                error => {
                    this.alertService.error(error);
                    this.loading = false;
                });
    }

    ngOnDestroy() {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
