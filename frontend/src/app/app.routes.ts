import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Shell } from './features/shell/shell';
import { MasPolicyWatch } from './features/mas-policy-watch/mas-policy-watch';
import { AnalysisResultsComponent } from './analysis-results/analysis-results';
<<<<<<< HEAD

=======
>>>>>>> origin/aj-branch

// Add 'export' before const routes
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: Shell,
    children: [
      { path: 'mas-policy-watch', component: MasPolicyWatch },
      { path: 'analysis-results', component: AnalysisResultsComponent },
      // add other protected routes here
    ],
  },
];
