import {
  Component,
  ElementRef,
  ViewChild,
  Renderer2,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceOverview } from '../compliance-overview/compliance-overview';
import { Results } from '../results/results';
import { Analytics } from '../analytics/analytics';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SecurityService } from '../security.service';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule, ComplianceOverview, Results, Analytics, RouterModule],
  templateUrl: './analysis-results.html',
  styleUrl: './analysis-results.css',
})
export class AnalysisResultsComponent {
  documentName = 'Expanded_Loan_Approval_Dossier_300pg1.docx';
  complianceScore = 92;
  highSeverity = 1;
  mediumSeverity = 1;
  lowSeverity = 1;

  activeTab = 'results';
  selectedFileName: string | null = null;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('myInput') myInputRef!: ElementRef<HTMLInputElement>;

  resultData: any;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private http: HttpClient
  ) {
    const nav = this.router.getCurrentNavigation();
    this.resultData = nav?.extras.state?.['resultData'];
    if (this.resultData) {
      this.updateComplianceStats(this.resultData);
    }
  }

  private security = inject(SecurityService);

  ngOnInit(): void {
    this.security.currentRoute$.subscribe((route) => {
      console.log('🔐 Home route:', route);
    });
  }

  private updateComplianceStats(data: any): void {
    this.documentName = data.input_document ?? 'Unnamed_Document.docx';
    this.complianceScore = data.compliance_score ?? 0 + '%';
    this.highSeverity = data.issue_counts?.High ?? 0;
    this.mediumSeverity = data.issue_counts?.Medium ?? 0;
    this.lowSeverity = data.issue_counts?.Low ?? 0;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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

  removeFile(): void {
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = '';
  }

  sendFileMessage(): void {
    const inputText = this.myInputRef.nativeElement.value.trim();

    if (!this.selectedFileName || !inputText) {
      console.warn('Please upload a file and enter a query.');
      return;
    }

    const file = this.fileInputRef.nativeElement.files?.[0];
    if (!file) {
      console.warn('No file found.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', inputText);

    this.http
      .post('https://tcg-45s9.onrender.com/check-compliance', formData)
      .subscribe({
        next: (response) => {
          this.resultData = response;
          this.updateComplianceStats(response);
        },
        error: (error) => {
          console.error('Error from backend:', error);
        },
      });

    // Clear input and file
    this.myInputRef.nativeElement.value = '';
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = '';
  }
}
