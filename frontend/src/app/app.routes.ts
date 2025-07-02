import { Routes } from '@angular/router';
import { Login } from './features/auth/login/login';
import { Shell } from './features/shell/shell';
import { MasPolicyWatch } from './features/mas-policy-watch/mas-policy-watch';
import { AnalysisResultsComponent } from './analysis-results/analysis-results';
import { Dashboard } from './dashboard/dashboard';
import { MasHistoryComponent } from './features/mas-history/mas-history';

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
      { path: 'analysis-results/:id', component: AnalysisResultsComponent},
      { path: 'analysis-results', component: AnalysisResultsComponent },
      { path: 'dashboard', component: Dashboard },
      { path: 'mas-history', component: MasHistoryComponent },
      // add other protected routes here
    ],
  },
];
