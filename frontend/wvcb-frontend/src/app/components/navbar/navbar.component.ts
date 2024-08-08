import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationUser } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  logoUrl: string = '';
  isMenuOpen: boolean = false;
  currentUser: ApplicationUser | null = null;
  private userSubscription: Subscription | null = null;
  navItems = [
    { label: 'HOME', route: '/home' },
    { label: 'EVENTS', route: '/events' },
    { label: 'ABOUT', route: '/about-us' },
    { label: 'JOIN', route: '/join' },
    { label: 'CONTACT', route: '/contact' },
  ];
  donateItem = { label: 'DONATE', route: '/donate' };

  constructor(
    private imageService: ImageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.logoUrl = this.imageService.getImageUrl('logo-white', {
      w: 350,
    });
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error('Logout failed', error);
        // You might want to show an error message to the user here
        // For example, using a toast notification service
      },
    });
  }
}
