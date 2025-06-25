import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-compliance-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compliance-overview.html',
  styleUrls: ['./compliance-overview.css']
})
export class ComplianceOverview {
  // Add these required @Input properties
  @Input() highSeverity: number = 0;
  @Input() mediumSeverity: number = 0;
  @Input() lowSeverity: number = 0;
  @Input() complianceScore: number = 0;
  @Input() documentName: string = '';
}

