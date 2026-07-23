import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AccountService, AlertService } from '@app/_services';
import { LocalVsBotsGameService } from '@app/_offline/local-vs-bots-game.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let localGame: any;

  beforeEach(waitForAsync(() => {
    localGame = { start: jasmine.createSpy('start') };
    TestBed.configureTestingModule({
      imports: [ ReactiveFormsModule ],
      declarations: [ HomeComponent ],
      providers: [
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
        { provide: AccountService, useValue: {
            userValue: { username: 'test' },
            homeInit: () => of({}),
            getUserState: () => of({ state: 'idle' }),
            getUserList: () => of([])
        } },
        { provide: AlertService, useValue: { info: () => {}, clear: () => {}, error: () => {} } },
        { provide: HttpClient, useValue: {} },
        { provide: MatDialog, useValue: {} },
        { provide: LocalVsBotsGameService, useValue: localGame }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts a local game with one bot by default', () => {
    (fixture.nativeElement.querySelector('.card-body button') as HTMLButtonElement).click();
    expect(localGame.start).toHaveBeenCalledWith({ botCount: 1 });
  });

  it('starts a local game with the chosen number of bots', () => {
    const select = fixture.nativeElement.querySelector('#botCount') as HTMLSelectElement;
    select.value = '3';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.card-body button') as HTMLButtonElement).click();
    expect(localGame.start).toHaveBeenCalledWith({ botCount: 3 });
  });
});
