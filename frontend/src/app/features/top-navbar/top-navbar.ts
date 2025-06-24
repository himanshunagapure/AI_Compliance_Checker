import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-top-navbar',
  imports: [NgIf],
  standalone: true,
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.css'
})
export class TopNavbar {
   @Input() showModelDropdown = true;
}
