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
import { RouterModule } from '@angular/router';

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
  }
}
