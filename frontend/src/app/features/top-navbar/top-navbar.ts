import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-top-navbar',
  imports: [NgIf],
  standalone: true,
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css',
})
export class TopNavbar {
  @Input() showModelDropdown = true;
  constructor(private router: Router) {}

  handlePolicyRoute(event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log(selectedValue);

    if (selectedValue === 'mas-policy-watch') {
      console.log('Navigating to MAS Policy Watch');
      this.router.navigate(['/mas-policy-watch']);
    }
  }
}
