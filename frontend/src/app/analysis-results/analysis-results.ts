import { Component, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplianceOverview } from '../compliance-overview/compliance-overview';
import { Results } from '../results/results';
import { Analytics } from '../analytics/analytics';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule, ComplianceOverview, Results, Analytics, RouterModule],
  templateUrl: './analysis-results.html',
  styleUrls: ['./analysis-results.css'],
})
export class AnalysisResultsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  private pendingRequest: any = null;

  backRoute: string = '/mas-policy-watch'; // default

  documentName = '';
  complianceScore = 0;
  highSeverity = 0;
  mediumSeverity = 0;
  lowSeverity = 0;

  activeTab = 'results';
  selectedFileName: string | null = null;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('myInput') myInputRef!: ElementRef<HTMLInputElement>;

  resultData: any;

  constructor(
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    // Listen for route changes and navigation state
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const analysisId = params.get('id');
      if (analysisId) {
        // If navigated with /analysis-results/:id, fetch from backend
        this.loadAnalysisData(analysisId);
      } else {
        // If navigated with state (from MAS History or upload), use state data
        const nav = this.router.getCurrentNavigation();
        const stateData = nav?.extras.state?.['resultData'];
        const from = nav?.extras.state?.['from']; 
        if (from === 'mas-history') {
          this.backRoute = '/mas-history';
        } else {
          this.backRoute = '/mas-policy-watch';
        }
        if (stateData) {
          this.updateComplianceStats(stateData);
        }
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  removeFile(): void {
    this.selectedFileName = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  triggerFileInput(): void {
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFileName = input.files[0].name;
      // Store the file for upload if needed
    }
  }

  private loadAnalysisData(analysisId: string): void {
    this.cancelPendingRequest();
    this.resultData = null;
    if (analysisId) {
      this.fetchHistoricalAnalysis(analysisId);
    }
  }

  private fetchHistoricalAnalysis(analysisId: string): void {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });

    this.pendingRequest = this.http
      .get(`/api/historical-analyses/${analysisId}`, { headers })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.updateComplianceStats(data);
          this.pendingRequest = null;
        },
        error: (error) => {
          console.error('Error fetching historical analysis:', error);
          this.pendingRequest = null;
        },
      });
  }

  private cancelPendingRequest(): void {
    if (this.pendingRequest) {
      this.pendingRequest.unsubscribe();
      this.pendingRequest = null;
    }
  }

  private updateComplianceStats(data: any): void {
    this.documentName = data.input_document || '';
    this.complianceScore = data.compliance_score || 0;
    this.highSeverity = data.issue_counts?.High || 0;
    this.mediumSeverity = data.issue_counts?.Medium || 0;
    this.lowSeverity = data.issue_counts?.Low || 0;
    this.resultData = data;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cancelPendingRequest();
  }

  sendFileMessage(): void {
    // ... your upload logic ...
    // After successful upload:
    this.http
      .post('/api/check-compliance', FormData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.router.navigate(['/analysis-results'], {
            state: { resultData: response },
          });
        },
        error: (error) => {
          console.error('Error from backend:', error);
        },
      });
  }
}
