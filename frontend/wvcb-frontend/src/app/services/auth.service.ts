import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  ApplicationUser,
  ErrorResponse,
  LoginModel,
  RegisterModel,
  Session,
} from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;
  private currentUserSubject = new BehaviorSubject<ApplicationUser | null>(
    null
  );
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.checkToken();
  }

  login(
    credentials: LoginModel
  ): Observable<ApiResponse<Session> | ErrorResponse> {
    return this.http
      .post<ApiResponse<Session>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setToken(response.data.token);
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<ApiResponse<boolean> | ErrorResponse> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap((response) => {
          if (response.success) {
            this.removeToken();
            this.currentUserSubject.next(null);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(
    userData: RegisterModel
  ): Observable<ApiResponse<Session> | ErrorResponse> {
    return this.http
      .post<ApiResponse<Session>>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.setToken(response.data.token);
            this.currentUserSubject.next(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  confirmEmail(
    userId: string,
    token: string
  ): Observable<ApiResponse<string> | ErrorResponse> {
    return this.http
      .get<ApiResponse<string>>(`${this.apiUrl}/auth/confirm-email`, {
        params: { userId, token },
      })
      .pipe(catchError(this.handleError));
  }

  getUserProfile(): Observable<ApiResponse<ApplicationUser> | ErrorResponse> {
    return this.http
      .get<ApiResponse<ApplicationUser>>(`${this.apiUrl}/auth/profile`)
      .pipe(
        tap((response) => {
          if (response.success && response.data) {
            this.currentUserSubject.next(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  forgotPassword(
    email: string
  ): Observable<ApiResponse<string> | ErrorResponse> {
    return this.http
      .post<ApiResponse<string>>(`${this.apiUrl}/auth/forgot-password`, {
        email,
      })
      .pipe(catchError(this.handleError));
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Observable<ApiResponse<string> | ErrorResponse> {
    return this.http
      .post<ApiResponse<string>>(`${this.apiUrl}/auth/reset-password`, {
        email,
        token,
        newPassword,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError = (error: HttpErrorResponse): Observable<ErrorResponse> => {
    let errorResponse: ErrorResponse = {
      success: false,
      message: 'An unknown error occurred!',
      errors: [],
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorResponse.message = error.error.message;
    } else if (this.isApiResponse(error.error)) {
      // Server returned an ApiResponse
      errorResponse = {
        success: false,
        message: error.error.message,
        errors: error.error.errors || [],
      };
    } else if (typeof error.error === 'object' && error.error !== null) {
      // Server returned an error object, but not in ApiResponse format
      errorResponse.message = error.error.message || errorResponse.message;
      errorResponse.errors = Array.isArray(error.error.errors)
        ? error.error.errors
        : [];
    } else if (error.status === 0) {
      errorResponse.message =
        'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorResponse.message =
        'An error occurred while processing your request. Please try again.';
    } else if (error.status >= 500) {
      errorResponse.message =
        'A server error occurred. Please try again later.';
    }

    return throwError(() => errorResponse);
  }

  private isApiResponse(obj: any): obj is ApiResponse {
    return (
      obj && typeof obj === 'object' && 'success' in obj && 'message' in obj
    );
  }

  private checkToken() {
    if (this.isBrowser) {
      const token = this.getToken();
      if (token) {
        this.getUserProfile().subscribe();
      }
    }
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem('token');
    }
    return null;
  }

  private setToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem('token', token);
    }
  }

  private removeToken(): void {
    if (this.isBrowser) {
      localStorage.removeItem('token');
    }
  }
}
