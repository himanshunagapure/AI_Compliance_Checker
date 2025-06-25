import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplianceOverview } from './compliance-overview';

describe('ComplianceOverview', () => {
  let component: ComplianceOverview;
  let fixture: ComponentFixture<ComplianceOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplianceOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplianceOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
