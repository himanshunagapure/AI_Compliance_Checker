import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { SecurityService } from '../../security.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot implements AfterViewInit {
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('chatContainer') chatContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('myInput') myInputRef!: ElementRef;

  selectedFileName: string | null = null;
  selectedFocus: string | null = null;
  loading = false;

  private focusQueryMap: { [key: string]: string } = {
    'All Applicable Regulations': 'check all compliance documents',
    'AML Compliance': 'check for AML compliance',
    'KYC Regulations': 'check for KYC compliance',
    'Data Privacy': 'check for data privacy issues',
  };

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private http: HttpClient
  ) {}

  ngAfterViewInit(): void {}

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

  setText(event: MouseEvent, clickedText: string): void {
    event.preventDefault();

    if (!this.selectedFileName) {
      console.warn('Please upload a file before selecting a regulation focus.');
      return;
    }

    this.selectedFocus = clickedText;
    this.myInputRef.nativeElement.value = clickedText;
  }

  private security = inject(SecurityService);

  analysisPending = false;
  sendFileMessage(): void {
    console.log(this.selectedFileName);

    const inputText = this.myInputRef.nativeElement.value.trim();

    if (!this.selectedFileName || !inputText) {
      console.warn('Please upload a file and enter a query.');
      return;
    }

    const query = this.focusQueryMap[inputText] ?? inputText;

    this.appendMessage(inputText, false);

    const input = this.fileInputRef.nativeElement;
    const file = input.files?.[0];
    if (!file) {
      console.warn('No file found.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);

    this.loading = true;

    this.http
      .post<any>('https://tcg-45s9.onrender.com/check-compliance', formData)
      .subscribe({
        next: (response) => {
          this.loading = false;

          // Append user_name from localStorage
          const user_name = localStorage.getItem('user_name');
          const resultWithUser = { ...response, user_name };

          // 🔁 Save MAS history to Node backend
          this.http
            .post('http://localhost:8080/api/mas-history/save', resultWithUser)
            .subscribe({
              next: () => console.log('✅ MAS history saved to DB'),
              error: (err) =>
                console.error('❌ Failed to save MAS history:', err),
            });

          // 🧭 Navigation Logic
          const currentRoute = this.security.getCurrentRoute();
          if (currentRoute === '/mas-policy-watch') {
            this.router.navigate(['/analysis-results'], {
              state: { resultData: response },
            });
          } else {
            // ✅ Alert instead of prompt, and delay to ensure visibility
            setTimeout(() => {
              alert(
                '✅ Data loaded successfully! Visit MAS Policy Watch to view results.'
              );

              this.analysisPending = true;
              const sub = this.security.currentRoute$.subscribe((route) => {
                if (this.analysisPending && route === '/mas-policy-watch') {
                  this.router.navigate(['/analysis-results'], {
                    state: { resultData: response },
                  });
                  this.analysisPending = false;
                  sub.unsubscribe();
                }
              });
            }, 10);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error from backend:', error);
        },
      });

    // Reset inputs
    this.myInputRef.nativeElement.value = '';
    this.selectedFileName = null;
    this.fileInputRef.nativeElement.value = '';
    this.selectedFocus = null;
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

    const svgWrapper = this.renderer.createElement('div');
    this.renderer.addClass(svgWrapper, 'chatbot-logo');
    svgWrapper.innerHTML = this.logoSvg;

    this.renderer.appendChild(messageRow, messageDiv);
    this.renderer.appendChild(messageRow, svgWrapper);
    this.renderer.appendChild(container, messageRow);

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }
  logoSvg: string = `
          <svg
        width="57"
        height="57"
        viewBox="0 0 57 57"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="28.5"
          cy="28.5"
          r="28.5"
          transform="rotate(180 28.5 28.5)"
          fill="#011735"
        />
        <rect
          x="57"
          y="26"
          width="34"
          height="26"
          transform="rotate(180 57 26)"
          fill="#011735"
        />
        <circle cx="29" cy="29" r="20" fill="white" />
        <circle cx="28.9999" cy="29.0001" r="18.6341" fill="#011735" />
        <path
          d="M29.3893 16.2411H28.6919V20.8347H29.3893V16.2411Z"
          fill="#03BCA3"
        />
        <path
          d="M30.5827 20.3497H27.4937C26.6642 20.3497 25.9917 21.0252 25.9917 21.8585C25.9917 22.6917 26.6642 23.3672 27.4937 23.3672H30.5827C31.4123 23.3672 32.0848 22.6917 32.0848 21.8585C32.0848 21.0252 31.4123 20.3497 30.5827 20.3497Z"
          fill="#03BCA3"
        />
        <path
          d="M28.7538 21.7957H29.326C35.1866 21.7957 39.943 26.5733 39.943 32.4601C39.943 35.7695 37.2698 38.4547 33.9752 38.4547H24.1002C20.8056 38.4547 18.1323 35.7695 18.1323 32.4601C18.1323 26.5733 22.8888 21.7957 28.7493 21.7957H28.7538Z"
          fill="#03BCA3"
        />
        <path
          d="M36.5148 32.9271C36.2287 33.0708 35.9113 33.1426 35.585 33.1426H22.4959C22.1695 33.1426 21.8521 33.0663 21.566 32.9271C20.8642 32.5814 20.4708 31.8764 20.5691 31.1534L20.5781 31.0996C20.9134 28.6568 23.1172 26.7799 25.8128 26.6407C26.9528 26.5823 28.1553 26.5509 29.4025 26.5554C30.3815 26.5598 31.3292 26.5913 32.2412 26.6362C34.9502 26.7754 37.1675 28.6478 37.5072 31.0996C37.5072 31.1175 37.5117 31.1355 37.5161 31.1534C37.6145 31.8764 37.2211 32.5769 36.5193 32.9271H36.5148Z"
          fill="#011735"
        />
        <path
          d="M25.5891 31.9034C26.5668 31.9034 27.3593 31.1073 27.3593 30.1252C27.3593 29.1432 26.5668 28.347 25.5891 28.347C24.6114 28.347 23.8188 29.1432 23.8188 30.1252C23.8188 31.1073 24.6114 31.9034 25.5891 31.9034Z"
          fill="#EEFDFF"
        />
        <path
          d="M25.5892 31.6206C26.4113 31.6206 27.0778 30.9511 27.0778 30.1253C27.0778 29.2995 26.4113 28.63 25.5892 28.63C24.7671 28.63 24.1006 29.2995 24.1006 30.1253C24.1006 30.9511 24.7671 31.6206 25.5892 31.6206Z"
          fill="#011735"
        />
        <path
          d="M26.5416 29.7346C26.5416 30.0399 26.2957 30.2869 25.9917 30.2869C25.6878 30.2869 25.4419 30.0399 25.4419 29.7346C25.4419 29.4292 25.6878 29.1823 25.9917 29.1823C26.2957 29.1823 26.5416 29.4292 26.5416 29.7346Z"
          fill="#EEFDFF"
        />
        <path
          d="M25.3699 31.4902C25.4909 31.4902 25.589 31.3917 25.589 31.2702C25.589 31.1487 25.4909 31.0502 25.3699 31.0502C25.2489 31.0502 25.1509 31.1487 25.1509 31.2702C25.1509 31.3917 25.2489 31.4902 25.3699 31.4902Z"
          fill="#EEFDFF"
        />
        <path
          d="M24.8246 30.9381C24.8246 31.0009 24.7754 31.0503 24.7128 31.0503C24.6502 31.0503 24.6011 31.0009 24.6011 30.9381C24.6011 30.8752 24.6502 30.8258 24.7128 30.8258C24.7754 30.8258 24.8246 30.8752 24.8246 30.9381Z"
          fill="#EEFDFF"
        />
        <path
          d="M32.259 31.9034C33.2367 31.9034 34.0293 31.1073 34.0293 30.1252C34.0293 29.1432 33.2367 28.347 32.259 28.347C31.2813 28.347 30.4888 29.1432 30.4888 30.1252C30.4888 31.1073 31.2813 31.9034 32.259 31.9034Z"
          fill="#EEFDFF"
        />
        <path
          d="M32.2586 31.6206C33.0808 31.6206 33.7473 30.9511 33.7473 30.1253C33.7473 29.2995 33.0808 28.63 32.2586 28.63C31.4365 28.63 30.77 29.2995 30.77 30.1253C30.77 30.9511 31.4365 31.6206 32.2586 31.6206Z"
          fill="#011735"
        />
        <path
          d="M33.211 29.7346C33.211 30.0399 32.9652 30.2869 32.6612 30.2869C32.3572 30.2869 32.1113 30.0399 32.1113 29.7346C32.1113 29.4292 32.3572 29.1823 32.6612 29.1823C32.9652 29.1823 33.211 29.4292 33.211 29.7346Z"
          fill="#EEFDFF"
        />
        <path
          d="M32.035 31.4902C32.1559 31.4902 32.254 31.3917 32.254 31.2702C32.254 31.1487 32.1559 31.0502 32.035 31.0502C31.914 31.0502 31.8159 31.1487 31.8159 31.2702C31.8159 31.3917 31.914 31.4902 32.035 31.4902Z"
          fill="#EEFDFF"
        />
        <path
          d="M31.4896 30.9381C31.4896 31.0009 31.4405 31.0503 31.3779 31.0503C31.3153 31.0503 31.2661 31.0009 31.2661 30.9381C31.2661 30.8752 31.3153 30.8258 31.3779 30.8258C31.4405 30.8258 31.4896 30.8752 31.4896 30.9381Z"
          fill="#EEFDFF"
        />
        <path
          d="M29.9297 15.9358C29.9297 16.4297 29.5319 16.8338 29.0357 16.8338C28.5395 16.8338 28.1416 16.4342 28.1416 15.9358C28.1416 15.4374 28.5395 15.0377 29.0357 15.0377C29.5319 15.0377 29.9297 15.4374 29.9297 15.9358Z"
          fill="#03BCA3"
        />
        <path
          d="M29.6616 15.5856C29.6616 15.7382 29.5409 15.8595 29.3889 15.8595C29.2369 15.8595 29.1162 15.7382 29.1162 15.5856C29.1162 15.4329 29.2369 15.3116 29.3889 15.3116C29.5409 15.3116 29.6616 15.4329 29.6616 15.5856Z"
          fill="white"
        />
        <path
          d="M36.68 30.4755C36.5816 30.5473 35.8887 29.1284 34.0246 27.8935C33.372 27.4625 32.7238 27.1526 32.764 27.0628C32.8042 26.973 33.5329 27.1392 34.114 27.4131C35.9692 28.2797 36.8007 30.3902 36.6845 30.4755H36.68Z"
          fill="white"
        />
        <path
          d="M31.7047 34.2069C31.6824 34.4449 31.4857 34.629 31.2487 34.6514L27.9809 34.9702C27.744 34.9927 27.516 34.8535 27.449 34.6245C27.4177 34.5212 27.3953 34.4179 27.3774 34.3102C27.3774 34.2787 27.3774 34.2518 27.3998 34.2248C27.4177 34.2024 27.4445 34.1844 27.4758 34.1844L31.6019 33.7848C31.6332 33.7848 31.66 33.7893 31.6824 33.8117C31.7047 33.8297 31.7181 33.8611 31.7181 33.8881C31.7226 33.9958 31.7181 34.1036 31.7092 34.2114L31.7047 34.2069Z"
          fill="#EEFDFF"
        />
        <path
          d="M31.7048 34.2069C31.602 35.2262 30.7929 36.0614 29.7423 36.1647C28.7052 36.2635 27.7665 35.6169 27.458 34.6604C27.5385 34.867 27.753 34.9882 27.9766 34.9658L31.2488 34.6515C31.4858 34.629 31.6825 34.4449 31.7048 34.2069Z"
          fill="#079E85"
        />
      </svg>
  `;
}
