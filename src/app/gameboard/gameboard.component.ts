import { Component, OnInit } from '@angular/core';
import {first, flatMap} from 'rxjs/operators';
import {GameState, User} from '@app/_models';

import {AccountService, AlertService, GameService} from '@app/_services';
import {config, interval, Observable} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {DialogComponent} from '@app/dialog/dialog.component';
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
  constructor( private route: ActivatedRoute,
               private router: Router,
               private accountService: AccountService,
               private alertService: AlertService,
               private http: HttpClient,
               private gameService: GameService) {
    this.user = this.accountService.userValue;
  }

  ngOnInit(): void {
    interval(2 * 1000)
        .pipe(
            flatMap(() => this.gameService.getGameState())
        )
        .subscribe(data => {
          console.log(data);
          if (data.state === 'init' && this.lastPlayer !== 'init'){
            this.gameService.getFullState()
                .subscribe(gameState => {
                  console.log(gameState);
                  this.gameStateLocal = gameState;
                });
          }
          this.lastPlayer = data.state;
      });
  }
}
