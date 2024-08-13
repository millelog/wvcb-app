import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ApiResponse,
  ErrorResponse,
  RegisterModel,
  Session,
} from '../../models/models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  error: ErrorResponse | null = null;
  successMessage: string = '';
  isLoading: boolean = false;

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
      this.isLoading = true;
      this.error = null;
      this.successMessage = '';

      const formValue = this.registerForm.value;
      const registrationData: RegisterModel = {
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        password: formValue.password,
      };

      this.authService.register(registrationData).subscribe({
        next: (response: ApiResponse<Session> | ErrorResponse) => {
          this.isLoading = false;
          if (response.success && 'data' in response) {
            console.log('Registration successful', response.data);
            this.successMessage = 'Registration successful. Redirecting...';
            setTimeout(() => this.router.navigate(['/members']), 2000);
          } else {
            this.error = response as ErrorResponse;
            console.error('Registration error', this.error);
          }
        },
        error: (errorResponse: ErrorResponse) => {
          this.isLoading = false;
          this.error = errorResponse;
          console.error('Registration error', this.error);
        },
      });
    }
  }
}
