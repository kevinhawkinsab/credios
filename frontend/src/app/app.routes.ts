import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: 'login',
    data: { mode: 'login' },
    loadChildren: () =>
      import('./features/auth/auth.routes').then(({ AUTH_ROUTES }) => AUTH_ROUTES),
  },
  {
    path: 'register',
    data: { mode: 'register' },
    loadChildren: () =>
      import('./features/auth/auth.routes').then(({ AUTH_ROUTES }) => AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        ({ DASHBOARD_ROUTES }) => DASHBOARD_ROUTES,
      ),
  },
  {
    path: 'solicitudes',
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
