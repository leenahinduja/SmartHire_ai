import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="center-page">
      <div class="fp-card fade-in">
        <div class="fp-icon">🔐</div>
        <h3>Reset Password</h3>
        <p>Enter your email and we'll send you a reset link</p>

        <div class="alert alert-success" *ngIf="success">{{ success }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()" style="margin-top:24px">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" class="form-control" formControlName="email" placeholder="you@email.com" />
          </div>
          <button type="submit" class="btn btn-primary btn-full" style="margin-top:20px" [disabled]="loading">
            <span *ngIf="!loading">Send Reset Link</span>
            <div *ngIf="loading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
          </button>
        </form>

        <div style="margin-top:20px;text-align:center;font-size:13px;color:var(--text-muted)">
          <a routerLink="/login" style="color:var(--teal);text-decoration:none">← Back to Login</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .center-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-base); padding: 20px;
    }
    .fp-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 40px;
      width: 100%; max-width: 400px; text-align: center;
    }
    .fp-icon { font-size: 40px; margin-bottom: 16px; }
    h3 { font-size: 1.5rem; margin-bottom: 8px; }
    p { color: var(--text-secondary); font-size: 14px; }
  `]
})
export class ForgotPasswordComponent {
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  error = ''; success = ''; loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next: () => { this.success = 'Reset link sent! Check your inbox.'; this.loading = false; },
      error: (e) => { 
        const errMsg = e.error?.message || e.error?.msg || (typeof e.error === 'string' ? e.error : 'Error sending reset email');
        this.error = errMsg;
        this.loading = false; 
      }
    });
  }
}
