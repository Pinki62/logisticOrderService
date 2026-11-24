import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, UserAccess } from '../../core/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <section class="auth-card">
        <p class="eyebrow">LOGISTICS ORDER SERVICE</p>

        <h1>{{ isRegister() ? 'Create your account' : 'Welcome back' }}</h1>
        <p class="subtitle">
          {{
            isRegister()
              ? 'Register to browse products and place orders.'
              : 'Sign in to manage your orders.'
          }}
        </p>

        <p class="notice success" *ngIf="message()">{{ message() }}</p>
        <p class="notice error" *ngIf="error()">{{ error() }}</p>

        <form
          *ngIf="!isRegister()"
          [formGroup]="loginForm"
          (ngSubmit)="submitLogin()"
        >
          <label for="login-email">Email</label>
          <input id="login-email" type="email" formControlName="email" />
          <small
            class="field-error"
            *ngIf="loginForm.controls.email.touched && loginForm.controls.email.invalid"
          >
            Enter a valid email address.
          </small>

          <label for="login-password">Password</label>
          <input id="login-password" type="password" formControlName="password" />
          <small
            class="field-error"
            *ngIf="loginForm.controls.password.touched && loginForm.controls.password.invalid"
          >
            Password is required.
          </small>

          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>

        <form
          *ngIf="isRegister()"
          [formGroup]="registerForm"
          (ngSubmit)="submitRegister()"
        >
          <label for="register-email">Email</label>
          <input id="register-email" type="email" formControlName="email" />
          <small
            class="field-error"
            *ngIf="registerForm.controls.email.touched && registerForm.controls.email.invalid"
          >
            Enter a valid email address.
          </small>

          <label for="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            formControlName="password"
          />
          <small
            class="field-error"
            *ngIf="registerForm.controls.password.touched && registerForm.controls.password.invalid"
          >
            Use at least 6 characters.
          </small>

          <label for="register-access">Account access</label>
          <select id="register-access" formControlName="access">
            <option value="VIEW">View orders and products</option>
            <option value="CREATE">Create orders</option>
          </select>

          <button type="submit" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <p class="switch-mode">
          {{ isRegister() ? 'Already registered?' : 'New here?' }}
          <button type="button" class="text-button" (click)="toggleMode()">
            {{ isRegister() ? 'Sign in' : 'Create an account' }}
          </button>
        </p>
      </section>
    </main>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background: #f3f6fa;
      font-family: Arial, sans-serif;
    }

    .auth-card {
      width: min(100%, 420px);
      padding: 36px;
      border-radius: 16px;
      background: white;
      box-shadow: 0 12px 40px rgba(24, 39, 75, 0.1);
    }

    .eyebrow {
      color: #3155a6;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.4px;
    }

    h1 { margin: 10px 0; color: #17233c; }
    .subtitle { margin: 0 0 24px; color: #68758b; line-height: 1.5; }

    label {
      display: block;
      margin: 16px 0 6px;
      color: #26344d;
      font-weight: 600;
    }

    input, select {
      box-sizing: border-box;
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd3df;
      border-radius: 8px;
      font: inherit;
    }

    button[type='submit'] {
      width: 100%;
      margin-top: 24px;
      padding: 13px;
      border: 0;
      border-radius: 8px;
      background: #3155a6;
      color: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }

    button[disabled] { opacity: 0.65; cursor: wait; }
    .switch-mode { margin-top: 22px; text-align: center; color: #68758b; }
    .text-button { border: 0; background: none; color: #3155a6; cursor: pointer; }
    .notice { padding: 10px 12px; border-radius: 8px; }
    .success { background: #e9f7ef; color: #20633b; }
    .error, .field-error { color: #b42318; }
    .field-error { display: block; margin-top: 5px; }
  `],
})
export class AuthComponent {
  readonly isRegister = signal(false);
  readonly loading = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    access: ['CREATE' as UserAccess],
  });

  toggleMode(): void {
    this.isRegister.update((value) => !value);
    this.message.set('');
    this.error.set('');
  }

  submitLogin(): void {
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/products');
      },
      error: (response: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(response.error?.message ?? 'Could not sign in.');
      },
    });
  }

  submitRegister(): void {
    this.registerForm.markAllAsTouched();
    if (this.registerForm.invalid) return;

    this.loading.set(true);
    this.error.set('');
    this.message.set('');

    this.authService.register({
      ...this.registerForm.getRawValue(),
      role: 'USER',
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.isRegister.set(false);
        this.message.set('Account created. You can now sign in.');
        this.loginForm.controls.email.setValue(
          this.registerForm.controls.email.value
        );
      },
      error: (response: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(response.error?.message ?? 'Could not create account.');
      },
    });
  }
}