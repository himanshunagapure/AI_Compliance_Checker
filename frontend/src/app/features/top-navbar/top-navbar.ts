import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css',
})
export class TopNavbar {
  @Input() showModelDropdown = true;

  constructor(private router: Router, private location: Location) {}

  onModelChange(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    const targetUrl = `/${selectedValue}`;

    if (!selectedValue) return;

    const currentPath = this.location.path();

    if (currentPath === targetUrl) {
      // Already on this route — reload the page
      window.location.reload();
    } else {
      // Navigate to new route
      this.router.navigate([targetUrl]);
    }
  }
}
