import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  ApplicationUser,
  LoginModel,
  RegisterModel,
  Session,
} from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<ApplicationUser | null>(
    null
  );
  currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.checkToken();
  }

  private checkToken() {
    const token = this.getToken();
    if (token) {
      this.getUserProfile().subscribe();
    }
  }

  login(credentials: LoginModel): Observable<Session> {
    return this.http
      .post<ApiResponse<Session>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            this.setToken(response.data.token);
            this.currentUserSubject.next(response.data.user);
            return response.data;
          } else {
            throw new Error(response.message || 'Login failed');
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.removeToken();
        this.currentUserSubject.next(null);
      }),
      catchError(this.handleError)
    );
  }

  getUserProfile(): Observable<ApplicationUser> {
    return this.http.get<Session>(`${this.apiUrl}/auth/profile`).pipe(
      map((session) => session.user),
      tap((user) => {
        this.currentUserSubject.next(user);
      }),
      catchError(this.handleError)
    );
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

  register(
    userData: RegisterModel
  ): Observable<{ message: string; session: Session }> {
    return this.http
      .post<{ status: string; message: string; session: Session }>(
        `${this.apiUrl}/auth/register`,
        userData
      )
      .pipe(
        map((response) => ({
          message: response.message,
          session: response.session,
        })),
        tap(({ session }) => {
          if (session) {
            this.setToken(session.token);
            this.currentUserSubject.next(session.user);
          }
        }),
        catchError(this.handleError)
      );
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
    return this.http
      .post(`${this.apiUrl}/auth/reset-password`, {
        email,
        token,
        newPassword,
      })
      .pipe(catchError(this.handleError));
  }

  confirmEmail(userId: string, token: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/auth/confirm-email`, {
        params: { userId, token },
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error && typeof error.error.message === 'string') {
      errorMessage = error.error.message;
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
