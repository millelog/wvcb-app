// about-us.component.ts
import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="py-16">
      <div class="container mx-auto px-4">
        <div
          class="flex flex-col lg:flex-row gap-8 justify-evenly items-center"
        >
          <!-- About Us Column -->
          <div class="lg:w-1/2 max-w-[600px]">
            <h2 class="text-xl font-bold mb-6 text-cta">ABOUT US</h2>

            <h3 class="text-4xl font-semibold mb-4 text-seconday">
              Continuing Music Traditions
            </h3>
            <p class="mb-4 text-wvcbgrey">
              The Willamette Valley Concert Band has a long history of bringing
              music to life in our community. Originally founded as the Albany
              Civic Band in 1970, we have been performing and enriching the
              lives of our community members for over 50 years.
            </p>
            <p class="mb-4 text-wvcbgrey">
              In partnership with the Greater Albany Public Schools District, we
              have developed a mentoring program to support and encourage the
              growth of young musicians.
            </p>
            <div class="mb-6">
              <h4 class="text-xl font-semibold mb-2 text-secondary">
                Our Mission
              </h4>
              <ul class="list-disc list-inside text-wvcbgrey">
                <li>Sharing the Joy of Music</li>
                <li>Supporting Youth Band Programs</li>
                <li>Encouraging Young Musicians</li>
              </ul>
            </div>
            <p class="mb-6 text-wvcbgrey">
              Thanks to the generosity of our donors, we are also able to
              provide financial assistance to local band programs and offer
              scholarships for students to attend summer music camps. Your
              support helps us to achieve our goals of sharing the joy of music
              and fostering the next generation of musicians. We are deeply
              grateful for your contributions.
            </p>

            <p class="font-semibold text-wvcbgrey">
              Interested in joining our band?
              <a href="/contact" class="text-primary hover:underline"
                >Contact Us</a
              >
              today!
            </p>
            <p class="mt-2 font-semibold text-wvcbgrey">
              We rehearse Thursday nights from 7:30 – 9:30 PM September to July.
            </p>
          </div>

          <!-- Facebook Feed Column -->
          <div class="lg:w-1/2">
            <div
              [style.width.px]="iframeWidth"
              class="bg-white overflow-hidden mx-auto"
            >
              <h2 class="text-3xl font-bold mb-6 text-secondary mx-auto">
                Follow us on Facebook
              </h2>
              <iframe
                [src]="facebookUrl"
                [style.width.px]="iframeWidth"
                class="h-[600px] mx-auto rounded-lg shadow-md "
                style="border:none;overflow:hidden"
                scrolling="no"
                frameborder="0"
                allowfullscreen="true"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              >
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AboutUsComponent implements OnInit {
  facebookUrl: SafeResourceUrl;
  iframeWidth: number = 500;

  constructor(private sanitizer: DomSanitizer) {
    this.facebookUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  ngOnInit() {
    this.setIframeWidth();
    this.updateFacebookUrl();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setIframeWidth();
    this.updateFacebookUrl();
  }

  setIframeWidth() {
    const screenWidth = window.innerWidth;
    this.iframeWidth = screenWidth < 500 ? Math.floor(screenWidth * 0.9) : 500;
  }

  updateFacebookUrl() {
    const baseUrl =
      'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FWillamette-Valley-Concert-Band-106903682699935%2F&tabs=timeline%2C%20events';
    const url = `${baseUrl}&width=${this.iframeWidth}&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;
    this.facebookUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
