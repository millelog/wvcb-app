// confirm-email.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiResponse, ErrorResponse } from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  message: string = '';
  isLoading: boolean = true;
  isSuccess: boolean = false;
  error: ErrorResponse | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const userId = params['userId'];
      const token = params['token'];

      if (userId && token) {
        this.confirmEmail(userId, token);
      } else {
        this.setErrorState('Invalid confirmation link.');
      }
    });
  }

  confirmEmail(userId: string, token: string) {
    // Decode the token
    const decodedToken = atob(token);

    this.authService.confirmEmail(userId, decodedToken).subscribe({
      next: (response: ApiResponse<string>) => {
        if (response.success) {
          this.setSuccessState(
            response.message ||
              'Your email has been confirmed successfully. You can now log in to your account.'
          );
          setTimeout(() => this.router.navigate(['/login']), 3000);
        } else {
          this.setErrorState(response.message || 'Failed to confirm email.');
        }
      },
      error: (errorResponse: ErrorResponse) => {
        this.error = errorResponse;
        this.setErrorState(
          errorResponse.message ||
            'An error occurred while confirming your email. Please try again or contact support.'
        );
        console.error('Email confirmation error', errorResponse);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private setSuccessState(message: string) {
    this.isSuccess = true;
    this.message = message;
    this.isLoading = false;
    this.error = null;
  }

  private setErrorState(message: string) {
    this.isSuccess = false;
    this.message = message;
    this.isLoading = false;
  }
}
