import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  showPassword = false;

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  // Hardcoded admin credentials
  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASSWORD = '1234';

  constructor(private router: Router) {}

  login() {
    if (this.username === this.ADMIN_USERNAME && this.password === this.ADMIN_PASSWORD) {
      // Simulate login by storing a flag in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      // Redirect to dashboard or admin page
       this.router.navigate(['/mas-policy-watch']);
      // window.location.href = 'https://www.google.com';
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}