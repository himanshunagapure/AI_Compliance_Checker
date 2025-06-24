import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  selectedFileName: string | null = null;

  triggerFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    console.log('File selected:', file);

    if (file) {
      this.selectedFileName = file.name;
      console.log('Filename set to:', this.selectedFileName);
    } else {
      console.log('No file selected.');
    }
  }

  removeFile(): void {
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = ''; // reset file input
  }
}
