import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results implements OnInit {
  @Input() resultData: any;
  selectedIssue: any = null;
  nonComplianceIssues: any[] = [];

  ngOnInit(): void {
    const tableData = this.resultData?.non_compliance_table ?? [];
    const detailedResults = this.resultData?.detailed_results ?? [];

    const mergedIssues: any[] = [];

    // 1. Extract detailed violations from detailed_results
    detailedResults.forEach((result: any) => {
      if (Array.isArray(result.violations) && result.violations.length) {
        result.violations.forEach((violation: any) => {
          mergedIssues.push({
            page: violation.page_number ?? -1,
            severity: violation.severity_level ?? 'Unknown',
            regulation: violation.reference_document ?? 'Unknown Regulation',
            confidence: violation.confidence ?? 0,
            pageSection: `Page ${violation.page_number ?? '?'}, Section ${
              violation.section ?? 'N/A'
            }`,
            regulatoryRef: violation.reference_document ?? 'N/A',
            nonCompliantText:
              violation.non_compliant_text ?? 'No text available.',
            explanation: violation.explanation ?? 'No explanation provided.',
            remediation:
              violation.remedy_recommendation ?? 'No remediation suggested.',
          });
        });
      }
    });

    // 2. Add basic items from non_compliance_table if not already covered
    tableData.forEach((item: any) => {
      const alreadyExists = mergedIssues.some(
        (issue) =>
          issue.page === (item.page_number ?? -1) &&
          issue.regulation === (item.regulation ?? 'Unknown Regulation')
      );

      if (!alreadyExists) {
        mergedIssues.push({
          page: item.page_number ?? -1,
          severity: item.severity_level ?? 'Unknown',
          regulation: item.regulation ?? 'Unknown Regulation',
          confidence: item.confidence_percentage ?? 0,
          pageSection: `Page ${item.page_number ?? '?'}`,
          regulatoryRef: item.regulation ?? 'N/A',
          nonCompliantText: '—',
          explanation: '—',
          remediation: '—',
        });
      }
    });

    this.nonComplianceIssues = mergedIssues;
  }

  selectIssue(issue: any) {
    this.selectedIssue = issue;
  }
}
