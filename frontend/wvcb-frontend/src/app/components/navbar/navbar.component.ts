import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApplicationUser } from '../../models/models';
import { AuthService } from '../../services/auth.service';
import { ImageService } from '../../services/image.service';
import { ToastService } from '../../services/toast/toast.service';

interface NavItem {
  label: string;
  route?: string;
  subItems?: NavItem[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  logoUrl: string = '';
  isMenuOpen: boolean = false;
  isUserMenuOpen: boolean = false;
  currentUser: ApplicationUser | null = null;
  private userSubscription: Subscription | null = null;
  navItems: NavItem[] = [
    { label: 'Home', route: '/home' },
    { label: 'Events', route: '/events' },
    {
      label: 'About Us',
      subItems: [
        { label: 'About', route: '/about-us' },
        { label: 'Join', route: '/join' },
        { label: 'Contact', route: '/contact' },
      ],
      isOpen: false,
    },
  ];
  donateItem = { label: 'Donate', route: '/donate' };

  constructor(
    private imageService: ImageService,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
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

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
    // Close other open menus when opening user menu
    this.navItems.forEach((item) => (item.isOpen = false));
  }

  toggleSubmenu(item: NavItem) {
    item.isOpen = !item.isOpen;
    // Close other open menus
    this.navItems.forEach((navItem) => {
      if (navItem !== item) {
        navItem.isOpen = false;
      }
    });
    this.isUserMenuOpen = false;
  }

  toggleMobileSubmenu(item: NavItem) {
    item.isOpen = !item.isOpen;
  }

  toggleMobileUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/home']);
        this.isUserMenuOpen = false;
      },
      error: (error) => {
        console.error('Logout failed', error);
        this.toastService.showError('Logout failed');
      },
    });
  }
}
