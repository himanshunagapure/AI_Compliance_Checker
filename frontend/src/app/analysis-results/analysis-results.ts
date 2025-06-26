<<<<<<< HEAD
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceOverview } from '../compliance-overview/compliance-overview';
=======
import {
  Component,
  ElementRef,
  Input,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceOverview } from '../compliance-overview/compliance-overview';
import { Results } from '../results/results';
import { Analytics } from '../analytics/analytics';
import { Router } from '@angular/router';
>>>>>>> origin/aj-branch

@Component({
  selector: 'app-analysis-results',
  standalone: true,
<<<<<<< HEAD
  imports: [CommonModule, ComplianceOverview],
  templateUrl: './analysis-results.html',
  styleUrl: './analysis-results.css'
=======
  imports: [CommonModule, ComplianceOverview, Results, Analytics],
  templateUrl: './analysis-results.html',
  styleUrl: './analysis-results.css',
>>>>>>> origin/aj-branch
})
export class AnalysisResultsComponent {
  documentName = 'Expanded_Loan_Approval_Dossier_300pg1.docx';
  complianceScore = 92;
  highSeverity = 1;
  mediumSeverity = 1;
  lowSeverity = 1;
<<<<<<< HEAD
  
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
=======

  activeTab = 'results';
  selectedFileName: string | null = null;
  selectedFocus: string | null = null;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('myInput') myInputRef!: ElementRef<HTMLInputElement>;

  constructor(private renderer: Renderer2, private router: Router) {}

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  private appendMessage(content: string, isFile: boolean): void {
    const container = this.chatContainerRef.nativeElement;

    const messageRow = this.renderer.createElement('div');
    this.renderer.addClass(messageRow, 'chatbot-message-row');
    this.renderer.addClass(messageRow, 'user');

    const messageDiv = this.renderer.createElement('div');
    this.renderer.addClass(messageDiv, 'chatbot-user-message');
    if (isFile) this.renderer.addClass(messageDiv, 'file-message');

    const contentNode = this.renderer.createElement('span');
    this.renderer.addClass(contentNode, isFile ? 'file-tag' : 'text-tag');
    this.renderer.setProperty(contentNode, 'innerText', content);
    this.renderer.appendChild(messageDiv, contentNode);

    this.renderer.appendChild(messageRow, messageDiv);
    this.renderer.appendChild(container, messageRow);

    setTimeout(() => {
      messageRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }

  removeFile(): void {
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = '';
  }

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (this.selectedFileName) {
      console.warn('Only one file can be selected at a time.');
      input.value = '';
      return;
    }

    if (file) {
      this.selectedFileName = file.name;
    }
  }

  sendFileMessage(): void {
    // Check if file and focus are both selected
    if (!this.selectedFileName || !this.selectedFocus) {
      console.warn('Please upload a file and select a regulation focus first.');
      return;
    }

    // Append only the regulation focus as the message
    this.appendMessage(this.selectedFocus, false);

    // Clear input field and file
    this.myInputRef.nativeElement.value = '';
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = '';
    this.selectedFocus = null;

    setTimeout(() => {
      this.router.navigate(['/analysis-results']);
    }, 5000);
>>>>>>> origin/aj-branch
  }
}
