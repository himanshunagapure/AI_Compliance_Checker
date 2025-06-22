import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';

// Add 'export' before const routes
export const routes: Routes = [
  { 
    path: 'login', 
    component: Login
  },
  { 
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full' 
  }
];
