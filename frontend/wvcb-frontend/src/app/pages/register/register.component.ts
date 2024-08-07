// register.component.ts
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
import { AuthResponse, RegisterModel } from '../../models/auth.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.registerForm.patchValue({ email: params['email'] });
      }
      if (params['firstName']) {
        this.registerForm.patchValue({ firstName: params['firstName'] });
      }
      if (params['lastName']) {
        this.registerForm.patchValue({ lastName: params['lastName'] });
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      const formValue = this.registerForm.value;
      const registrationData: RegisterModel = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        password: formValue.password,
      };

      this.authService.register(registrationData).subscribe({
        next: (response: AuthResponse) => {
          console.log('Registration successful', response);
          // Now log the user in
          this.authService
            .login({
              username: registrationData.email,
              password: registrationData.password,
            })
            .subscribe({
              next: (loginResponse: AuthResponse) => {
                console.log('Login successful', loginResponse);
                // Redirect to home page or dashboard
                this.router.navigate(['/home']);
              },
              error: (loginError: HttpErrorResponse) => {
                console.error('Login error', loginError);
                this.errorMessage =
                  'Registration successful, but login failed. Please try logging in manually.';
              },
            });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration error', error);
          this.errorMessage =
            error.error?.message || 'Registration failed. Please try again.';
        },
      });
    }
  }
}