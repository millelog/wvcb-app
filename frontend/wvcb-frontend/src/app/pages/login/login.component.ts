import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  ApiResponse,
  ErrorResponse,
  LoginModel,
  Session,
} from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  error: ErrorResponse | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;
      const loginData: LoginModel = this.loginForm.value;

      this.authService.login(loginData).subscribe({
        next: (response: ApiResponse<Session> | ErrorResponse) => {
          this.isLoading = false;
          if (response.success && 'data' in response) {
            console.log('Login successful', response.data);
            this.router.navigate(['/members']);
          } else {
            this.error = response as ErrorResponse;
            console.error('Login failed', this.error);
          }
        },
        error: (errorResponse: ErrorResponse) => {
          this.isLoading = false;
          this.error = errorResponse;
          console.error('Login error', this.error);
        },
      });
    }
  }
}
