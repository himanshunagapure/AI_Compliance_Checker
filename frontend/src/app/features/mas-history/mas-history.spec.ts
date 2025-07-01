import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasHistory } from './mas-history';

describe('MasHistory', () => {
  let component: MasHistory;
  let fixture: ComponentFixture<MasHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasHistory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
