import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  showPassword = false;

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  private readonly ADMIN_USERNAME = 'admin';
  private readonly ADMIN_PASSWORD = '1234';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      this.router.navigate(['/mas-policy-watch']);
    }
  }

  login() {
    if (
      this.username === this.ADMIN_USERNAME &&
      this.password === this.ADMIN_PASSWORD
    ) {
      localStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = 'Invalid username or password';
    }
  }
}
