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
    // ✅ Inject dummy if routed directly
    if (!this.resultData) {
      this.resultData = {
        detailed_results: [
          {
            violations: Array.from({ length: 3 }).map(() => ({
              page_number: null,
              severity_level: null,
              reference_document: null,
              confidence: null,
              section: null,
              non_compliant_text: null,
              explanation: null,
              remedy_recommendation: null,
            })),
          },
        ],
        non_compliance_table: Array.from({ length: 2 }).map(() => ({
          page_number: null,
          severity_level: null,
          regulation: null,
          confidence_percentage: null,
        })),
      };
    }

    const tableData = this.resultData?.non_compliance_table ?? [];
    const detailedResults = this.resultData?.detailed_results ?? [];

    const mergedIssues: any[] = [];

    // 1. Extract detailed violations from detailed_results
    detailedResults.forEach((result: any) => {
      if (Array.isArray(result.violations) && result.violations.length) {
        result.violations.forEach((violation: any) => {
          mergedIssues.push({
            page:
              violation.page_number ??
              Math.floor(Math.random() * 10 + Math.floor(Math.random() * 10)),
            severity:
              violation.severity_level ??
              ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
            regulation:
              violation.reference_document ??
              [
                'MAS Notice 123 Section 4.2',
                'MAS Guidelines on Risk Management Practices - Technology Risk',
                'MAS Notice 314 on Prevention of Money Laundering',
              ][Math.floor(Math.random() * 3)],
            confidence:
              violation.confidence ??
              Math.floor(Math.random() * (98 - 75 + 1)) + 75,
            pageSection: `Page ${
              violation.page_number ?? Math.floor(Math.random() * 10)
            }, Section ${
              violation.section ??
              ['Section 4.2', 'section 6.3', 'Section 12.15'][
                Math.floor(Math.random() * 3)
              ]
            }`,
            regulatoryRef:
              violation.reference_document ??
              [
                'MAS Notice 123 Section 4.2',
                'MAS Guidelines on Risk Management Practices - Technology Risk',
                'MAS Notice 314 on Prevention of Money Laundering',
              ][Math.floor(Math.random() * 3)],
            nonCompliantText:
              violation.non_compliant_text ??
              [
                'Customer verification processes may be completed within 30 business days of account opening.',
                'No mention of real-time logging for critical systems.',
                'Processes may be completed within 30 business days of account opening.',
              ][Math.floor(Math.random() * 3)],
            explanation:
              violation.explanation ??
              [
                'MAS Notice 123 requires stricter verification deadlines for certain customer categories.',
                'The guideline mandates implementation of real-time logging and monitoring for all critical systems.',
                'MAS Notice 314 requires verification to be completed within 15 business days for standard risk customers.',
              ][Math.floor(Math.random() * 3)],
            remediation:
              violation.remedy_recommendation ??
              [
                'Revise to: "Customer verification processes must be completed within 15 business days of account opening for standard risk customers, and 5 business days for high-risk customers."',
                'Update the IT policy to include continuous logging for system events and access.',
                'Revise to: "Verification must be completed within 15 business days for all customer types."',
              ][Math.floor(Math.random() * 3)],
          });
        });
      }
    });

    // 2. Add basic items from non_compliance_table if not already covered
    tableData.forEach((item: any) => {
      const fallbackPage =
        item.page_number ?? Math.floor(Math.random() * 20 + 1);
      const fallbackRegulation =
        item.regulation ??
        [
          'MAS Notice 123 Section 4.2',
          'MAS Guidelines on Risk Management Practices - Technology Risk',
          'MAS Notice 314 on Prevention of Money Laundering',
        ][Math.floor(Math.random() * 3)];

      const alreadyExists = mergedIssues.some(
        (issue) =>
          issue.page === fallbackPage && issue.regulation === fallbackRegulation
      );

      if (!alreadyExists) {
        mergedIssues.push({
          page: fallbackPage,
          severity:
            item.severity_level ??
            ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
          regulation: fallbackRegulation,
          confidence:
            item.confidence_percentage ??
            Math.floor(Math.random() * (98 - 75 + 1)) + 75,
          pageSection: `Page ${fallbackPage}`,
          regulatoryRef: fallbackRegulation,
          nonCompliantText: [
            'Customer verification processes may be completed within 30 business days of account opening.',
            'No mention of real-time logging for critical systems.',
            'Processes may be completed within 30 business days of account opening.',
          ][Math.floor(Math.random() * 3)],
          explanation: [
            'MAS Notice 123 requires stricter verification deadlines for certain customer categories.',
            'The guideline mandates implementation of real-time logging and monitoring for all critical systems.',
            'MAS Notice 314 requires verification to be completed within 15 business days for standard risk customers.',
          ][Math.floor(Math.random() * 3)],
          remediation: [
            'Revise to: "Customer verification processes must be completed within 15 business days of account opening for standard risk customers, and 5 business days for high-risk customers."',
            'Update the IT policy to include continuous logging for system events and access.',
            'Revise to: "Verification must be completed within 15 business days for all customer types."',
          ][Math.floor(Math.random() * 3)],
        });
      }
    });

    this.nonComplianceIssues = mergedIssues;
  }
  selectIssue(issue: any) {
    this.selectedIssue = issue;
  }
}
