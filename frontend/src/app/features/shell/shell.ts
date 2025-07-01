import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TopNavbar } from '../top-navbar/top-navbar';
import { filter } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [Sidebar, RouterOutlet, TopNavbar],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  showModelDropdown = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = (event as NavigationEnd).urlAfterRedirects;
        this.showModelDropdown = !url.startsWith('/dashboard');
      });
  }
}
