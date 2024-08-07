// sponsor.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ImageService } from '../../services/image.service';

@Component({
  selector: 'app-sponsor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-wvcbnavy py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-sm font-bold mb-4 text-center text-cta">SPONSORS</h2>
        <h3 class="text-3xl font-bold mb-6 text-center text-white">
          Thank You to Our Sponsors
        </h3>
        <p class="text-center text-white mb-8 max-w-2xl mx-auto">
          We are grateful to our sponsors for their support of the Willamette
          Valley Concert Band. Their generosity helps make our performances
          possible.
        </p>
        <div class="flex overflow-x-auto pb-4 space-x-6 justify-center">
          <div
            *ngFor="let sponsor of sponsors; let i = index"
            class="flex-none"
          >
            <div class="bg-white p-4 rounded-lg shadow-md">
              <img
                [src]="getSponsorImage(i + 1)"
                [alt]="'Sponsor ' + (i + 1)"
                class="h-36 object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .overflow-x-auto {
        -webkit-overflow-scrolling: touch;
      }
      .overflow-x-auto::-webkit-scrollbar {
        display: none;
      }
    `,
  ],
})
export class SponsorComponent implements OnInit {
  sponsors = [1, 2, 3, 4]; // Assuming we have 4 sponsors

  constructor(private imageService: ImageService) {}

  ngOnInit() {}

  getSponsorImage(index: number): string {
    return this.imageService.getImageUrl(`sponsor-${index}`, {
      w: 300,
      h: 150,
    });
  }
}
