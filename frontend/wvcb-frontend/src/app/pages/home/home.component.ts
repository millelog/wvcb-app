// src/app/pages/home/home.component.ts
import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ImageService } from '../../services/image.service';
import { AboutUsComponent } from './about-us.component';
import { SponsorComponent } from './sponsor.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgStyle, AboutUsComponent, SponsorComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  heroImageUrl: string = '';

  constructor(private imageService: ImageService) {}

  ngOnInit() {
    this.heroImageUrl = this.imageService.getImageUrl('wvcb-hero', {
      w: 1920,
      h: 1080,
    });
  }
}
