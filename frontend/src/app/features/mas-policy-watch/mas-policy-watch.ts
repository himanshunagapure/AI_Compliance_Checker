import { Component } from '@angular/core';
import { Chatbot } from '../chatbot/chatbot';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mas-policy-watch',
  imports: [Chatbot, CommonModule],
  templateUrl: './mas-policy-watch.html',
  styleUrl: './mas-policy-watch.css',
})
export class MasPolicyWatch {
  showChatbot = false;

  startChatbot() {
    this.showChatbot = true;
  }
}
