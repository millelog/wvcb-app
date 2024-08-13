// forgot-password.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiResponse, ErrorResponse } from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  message: string = '';
  isLoading: boolean = false;
  isSuccess: boolean = false;
  error: ErrorResponse | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.isLoading = true;
      this.message = '';
      this.error = null;
      const email = this.forgotPasswordForm.get('email')?.value;

      this.authService.forgotPassword(email).subscribe({
        next: (response: ApiResponse<string>) => {
          this.isSuccess = response.success;
          this.message = response.message;
        },
        error: (errorResponse: ErrorResponse) => {
          this.isSuccess = false;
          this.error = errorResponse;
          this.message = errorResponse.message;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }
}
