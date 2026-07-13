import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AlertComponent } from './alert.component';
import { Alert, AlertType } from '@app/_models';

describe('AlertComponent', () => {
  let component: AlertComponent;
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AlertComponent ],
      imports: [ CommonModule, RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertComponent);
    component = fixture.componentInstance;
  });

  it('renders a malicious message as literal text, not HTML', () => {
    const payload = '<img src=x onerror="window.__xss=1">';
    component.alerts = [ new Alert({ type: AlertType.Error, message: payload }) ];
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    // payload shown verbatim as text
    expect(el.textContent).toContain(payload);
    // no img element was ever created from the message
    expect(el.querySelector('img')).toBeNull();
    // onerror never fired
    expect((window as any).__xss).toBeUndefined();
  });
});
