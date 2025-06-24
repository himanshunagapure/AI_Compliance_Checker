import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasPolicyWatch } from './mas-policy-watch';

describe('MasPolicyWatch', () => {
  let component: MasPolicyWatch;
  let fixture: ComponentFixture<MasPolicyWatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasPolicyWatch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasPolicyWatch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
