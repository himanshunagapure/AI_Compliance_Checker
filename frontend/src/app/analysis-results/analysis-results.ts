import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceOverview } from '../compliance-overview/compliance-overview';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule, ComplianceOverview],
  templateUrl: './analysis-results.html',
  styleUrl: './analysis-results.css'
})
export class AnalysisResultsComponent {
  documentName = 'Expanded_Loan_Approval_Dossier_300pg1.docx';
  complianceScore = 92;
  highSeverity = 1;
  mediumSeverity = 1;
  lowSeverity = 1;
  
  activeTab = 'results';
  selectedIssue: any = null;
  
  nonComplianceIssues = [
    {
      page: 232,
      severity: 'High',
      regulation: 'MAS Notice 123 Section 4.2',
      confidence: 94,
      pageSection: 'Page 232, Section 4.2.1',
      regulatoryRef: 'MAS Notice 123 Section 4.2',
      nonCompliantText: 'Customer verification processes may be completed within 30 business days of account opening.',
      explanation: 'MAS Notice 123 requires verification to be completed within 15 business days for standard risk customers.',
      remediation: 'Revise to: "Customer verification processes must be completed within 15 business days of account opening."'
    },
    {
      page: 147,
      severity: 'Medium',
      regulation: 'MAS Guidelines on Risk Management Practices - Technology Risk',
      confidence: 87,
      pageSection: 'Page 147, Section 8.3.2',
      regulatoryRef: 'MAS Guidelines on Risk Management Practices',
      nonCompliantText: 'System backups should be performed regularly.',
      explanation: 'The regulation requires specific backup frequency and testing protocols.',
      remediation: 'Specify backup frequency (e.g., daily) and include testing requirements.'
    },
    {
      page: 289,
      severity: 'Low',
      regulation: 'MAS Notice 314 on Prevention of Money Laundering',
      confidence: 91,
      pageSection: 'Page 289, Section 12.1.5',
      regulatoryRef: 'MAS Notice 314',
      nonCompliantText: 'Enhanced due diligence may be applied for high-risk customers.',
      explanation: 'MAS Notice 314 requires enhanced due diligence to be applied (mandatory, not optional) for high-risk customers.',
      remediation: 'Change "may be applied" to "must be applied" to reflect the mandatory requirement.'
    }
  ];
  
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  
  selectIssue(issue: any) {
    this.selectedIssue = issue;
  }
}
