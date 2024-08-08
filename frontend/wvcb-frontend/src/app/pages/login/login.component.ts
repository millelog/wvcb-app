// login.component.ts
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { LoginModel, Session } from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

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

  private handleErrorResponse(error: HttpErrorResponse) {
    console.error('Login error', error);
    if (error.status === 0) {
      this.errorMessage =
        'Unable to connect to the server. Please check your internet connection and try again.';
    } else if (error.status === 401) {
      this.errorMessage = 'Invalid username or password. Please try again.';
    } else {
      this.errorMessage =
        'An unexpected error occurred. Please try again later.';
    }
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const loginData: LoginModel = this.loginForm.value;

      this.authService.login(loginData).subscribe({
        next: (response: Session) => {
          console.log('Login successful', response);
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.handleErrorResponse(error);
        },
      });
    }
  }
}
