import { Component } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  heroImageUrl: string = '';

  constructor(private imageService: ImageService) {
    this.heroImageUrl = this.imageService.getImageUrl('wvcb-hero', {
      w: 1920,
      h: 1080,
    });
  }
}
