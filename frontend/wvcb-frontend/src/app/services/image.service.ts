// src/app/services/image.service.ts

import { Injectable } from '@angular/core';
import { getImage } from '../utils/images';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  getImageUrl(
    id: string,
    params: Record<string, string | number> = {}
  ): string {
    return getImage(id, params);
  }
}
