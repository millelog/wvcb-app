// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'events',
    loadComponent: () =>
      import('./pages/events/events.component').then((m) => m.EventsComponent),
  },
  {
    path: 'about-us',
    loadComponent: () =>
      import('./pages/about-us/about-us.component').then(
        (m) => m.AboutUsComponent
      ),
  },
  {
    path: 'join',
    loadComponent: () =>
      import('./pages/join/join.component').then((m) => m.JoinComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact/contact.component').then(
        (m) => m.ContactComponent
      ),
  },
  {
    path: 'members',
    loadComponent: () =>
      import('./pages/members/members.component').then(
        (m) => m.MembersComponent
      ),
  },
  {
    path: 'donate',
    loadComponent: () =>
      import('./pages/donate/donate.component').then((m) => m.DonateComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./pages/confirm-email/confirm-email.component').then(
        (m) => m.ConfirmEmailComponent
      ),
  },
];
