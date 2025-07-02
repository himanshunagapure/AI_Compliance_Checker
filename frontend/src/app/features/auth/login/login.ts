import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  showPassword = false;

  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      this.router.navigate(['/mas-policy-watch']);
    }
  }

  login() {
    const loginData = {
      user_name: this.username,
      password: this.password,
    };

    this.http
      .post<any>('https://tcg-node.onrender.com/api/users/login', loginData)
      .subscribe({
        next: (res) => {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user_name', res.user.user_name);
          localStorage.setItem('role', res.user.role);
          this.router.navigate(['/mas-policy-watch']);
        },
        error: (err) => {
          this.errorMessage = err.error?.error || 'Login failed. Try again.';
        },
      });
  }
}