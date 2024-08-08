// auth.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginModel } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData).pipe(
      tap({
        next: (response) => console.log('Registration successful', response),
        error: (error) => console.error('Registration error', error),
      })
    );
  }

  login(credentials: LoginModel): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem('token', response.token);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
  forgotPassword(email: string): Observable<string> {
    return this.http
      .post(
        `${this.apiUrl}/auth/forgot-password`,
        { email },
        { responseType: 'text' }
      )
      .pipe(catchError(this.handleError));
  }

  resetPassword(
    email: string,
    token: string,
    newPassword: string
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      email,
      token,
      newPassword,
    });
  }

  confirmEmail(userId: string, token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/confirm-email`, {
      params: { userId, token },
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
      // Server-side error returning a string
      errorMessage = error.error;
    } else if (error.status === 0) {
      errorMessage =
        'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage =
        'An error occurred while processing your request. Please try again.';
    } else if (error.status >= 500) {
      errorMessage = 'A server error occurred. Please try again later.';
    }
    return throwError(() => new Error(errorMessage));
  }
}
