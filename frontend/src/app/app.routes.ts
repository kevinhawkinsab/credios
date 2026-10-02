import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    data: { mode: 'login' },
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(({ AUTH_ROUTES }) => AUTH_ROUTES),
  },
  {
    path: 'register',
    data: { mode: 'register' },
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(({ AUTH_ROUTES }) => AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        ({ DASHBOARD_ROUTES }) => DASHBOARD_ROUTES,
      ),
  },
  {
    path: 'solicitudes',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/requests/requests.routes').then(
        ({ REQUESTS_ROUTES }) => REQUESTS_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
