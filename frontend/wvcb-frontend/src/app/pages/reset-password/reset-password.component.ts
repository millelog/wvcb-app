// reset-password.component.ts
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  message: string = '';
  errors: string[] = []; // New property to store array of errors
  isLoading: boolean = false;
  isSuccess: boolean = false;
  email: string = '';
  token: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'];
      this.token = params['token'];
      if (!this.email || !this.token) {
        this.message = 'Invalid password reset link.';
        this.isSuccess = false;
      } else {
        // Decode the token
        this.token = atob(this.token);
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.valid) {
      this.isLoading = true;
      this.message = '';
      this.errors = []; // Clear previous errors
      const newPassword = this.resetPasswordForm.get('newPassword')?.value;

      this.authService
        .resetPassword(this.email, this.token, newPassword)
        .subscribe({
          next: (response: any) => {
            console.log('Reset password response:', response);
            this.isSuccess = true;
            this.message = response.message;
            setTimeout(() => this.router.navigate(['/login']), 3000);
          },
          error: (error: HttpErrorResponse) => {
            console.error('Reset password error:', error);
            this.isSuccess = false;
            if (error.error && error.error.message) {
              this.message = error.error.message;
              if (error.error.errors && Array.isArray(error.error.errors)) {
                this.errors = error.error.errors;
              }
            } else {
              this.message =
                'An error occurred while resetting your password. Please try again.';
            }
          },
          complete: () => {
            this.isLoading = false;
          },
        });
    }
  }
}
