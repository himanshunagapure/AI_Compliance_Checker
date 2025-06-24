import { Component } from '@angular/core';
import { Chatbot } from '../../chatbot/chatbot'; // Adjust path if needed
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mas-policy-watch',
  standalone: true,
  imports: [Chatbot, CommonModule],
  templateUrl: './mas-policy-watch.html',
  styleUrl: './mas-policy-watch.css',
})
export class MasPolicyWatch {
  showChatbot = false;

  startChatbot(): void {
    this.showChatbot = true;
  }
}
