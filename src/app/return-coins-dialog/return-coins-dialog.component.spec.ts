import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnCoinsDialogComponent } from './return-coins-dialog.component';

describe('ReturnCoinsDialogComponent', () => {
  let component: ReturnCoinsDialogComponent;
  let fixture: ComponentFixture<ReturnCoinsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReturnCoinsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReturnCoinsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
