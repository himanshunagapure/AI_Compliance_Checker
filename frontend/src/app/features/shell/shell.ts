import { Component } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar'; 
import { RouterOutlet } from '@angular/router'; 
import { TopNavbar } from '../top-navbar/top-navbar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [Sidebar, RouterOutlet, TopNavbar],
  templateUrl: './shell.html',
  styleUrl: './shell.css'
})
export class Shell {

}
