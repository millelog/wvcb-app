import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  logoUrl: string = '';
  isMenuOpen: boolean = false;
  navItems = [
    { label: 'HOME', route: '/home' },
    { label: 'EVENTS', route: '/events' },
    { label: 'ABOUT US', route: '/about-us' },
    { label: 'JOIN', route: '/join' },
    { label: 'CONTACT', route: '/contact' },
    { label: 'MEMBERS', route: '/members' },
  ];
  donateItem = { label: 'DONATE', route: '/donate' };

  constructor(private imageService: ImageService) {}

  ngOnInit() {
    this.logoUrl = this.imageService.getImageUrl('logo-white', {
      w: 350,
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
