import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavingsComponent } from './savings.component';

describe('SavingsComponent', () => {
  let component: SavingsComponent;
  let fixture: ComponentFixture<SavingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SavingsComponent]
    });
    fixture = TestBed.createComponent(SavingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
