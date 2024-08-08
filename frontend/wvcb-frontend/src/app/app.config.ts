import {
  HttpEvent,
  HttpHandler,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Observable } from 'rxjs';
import { routes } from './app.routes';
import { AuthInterceptor } from './auth.interceptor'; // Adjust this import path as necessary
import { AuthService } from './services/auth.service'; // Adjust this import path as necessary

// Wrapper function to convert HttpHandlerFn to HttpHandler
function handlerFnToHandler(handlerFn: HttpHandlerFn): HttpHandler {
  return {
    handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
      return handlerFn(req);
    },
  };
}

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  const authInterceptor = new AuthInterceptor(authService, platformId);
  return authInterceptor.intercept(req, handlerFnToHandler(next));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptorFn])),
  ],
};
