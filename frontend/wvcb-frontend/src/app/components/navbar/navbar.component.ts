import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  navItems = [
    { label: 'HOME', route: '/home' },
    { label: 'EVENTS', route: '/events' },
    { label: 'ABOUT US', route: '/about-us' },
    { label: 'JOIN', route: '/join' },
    { label: 'CONTACT', route: '/contact' },
    { label: 'MEMBERS', route: '/members' },
  ];
}
