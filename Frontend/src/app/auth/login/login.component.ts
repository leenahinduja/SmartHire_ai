import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">
          <span class="brand-icon">⬡</span>
          <span class="brand-text">SmartHire<span class="brand-ai">AI</span></span>
        </div>
        <div class="auth-tagline">
          <h2>Your AI-powered hiring partner</h2>
          <p>Screen candidates, run assessments, and hire smarter — all in one platform.</p>
        </div>
        <div class="auth-decorations">
          <div class="deco-card">
            <div class="deco-icon">🎯</div>
            <div>
              <div class="deco-title">ATS Score: 92%</div>
              <div class="deco-sub">Perfect match detected</div>
            </div>
          </div>
          <div class="deco-card" style="margin-left:32px;margin-top:12px">
            <div class="deco-icon">✅</div>
            <div>
              <div class="deco-title">Round 2 Unlocked</div>
              <div class="deco-sub">MCQ test sent to candidate</div>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-card fade-in">
          <div class="auth-header">
            <h3>Welcome back</h3>
            <p>Sign in to your SmartHireAI account</p>
          </div>

          <div class="alert alert-error" *ngIf="error">{{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" formControlName="email" placeholder="you@company.com" />
            </div>
            <div class="form-group" style="margin-top:16px">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" formControlName="password" placeholder="Your password" />
            </div>

            <div class="forgot-link">
              <a routerLink="/forgot-password">Forgot password?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-full" style="margin-top:24px" [disabled]="loading">
              <span *ngIf="!loading">Sign In</span>
              <div *ngIf="loading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
            </button>
          </form>

          <div class="auth-footer">
            Don't have an account? <a routerLink="/register">Create one</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }

    .auth-left {
      flex: 1; background: var(--bg-surface);
      border-right: 1px solid var(--border);
      padding: 60px; display: flex; flex-direction: column;
      gap: 48px;
    }
    .auth-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { color: var(--teal); font-size: 24px; }
    .brand-text { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
    .brand-ai { color: var(--teal); }
    .auth-tagline h2 { font-size: 2rem; line-height: 1.3; margin-bottom: 12px; }
    .auth-tagline p { color: var(--text-secondary); font-size: 1rem; }
    .deco-card {
      display: flex; align-items: center; gap: 12px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 14px 18px;
      max-width: 260px;
    }
    .deco-icon { font-size: 20px; }
    .deco-title { font-size: 13px; font-weight: 600; }
    .deco-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    .auth-right {
      width: 480px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      padding: 40px;
    }
    .auth-form-card { width: 100%; max-width: 380px; }
    .auth-header { margin-bottom: 28px; }
    .auth-header h3 { font-size: 1.6rem; margin-bottom: 4px; }
    .auth-header p { color: var(--text-secondary); font-size: 14px; }
    .forgot-link { margin-top: 8px; text-align: right; }
    .forgot-link a { font-size: 12px; color: var(--teal); text-decoration: none; }
    .auth-footer { margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-muted); }
    .auth-footer a { color: var(--teal); text-decoration: none; }

    @media(max-width: 768px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });
  error = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

 submit() {
  if (this.form.invalid) return;

  this.loading = true;
  this.error = '';

  const { email, password } = this.form.value;

  this.auth.login(email!, password!).subscribe({
    next: (res: any) => {
      console.log("Login Success:", res);

      // 🔥 STOP LOADING
      this.loading = false;

      // OPTIONAL: save user if not handled in service
      // localStorage.setItem('user', JSON.stringify(res));

      const user = this.auth.currentUser;

      // Check if there's a saved redirect URL (e.g., from clicking test link in email)
      const redirectUrl = localStorage.getItem('smarthire_redirect');
      if (redirectUrl) {
        localStorage.removeItem('smarthire_redirect');
        this.router.navigateByUrl(redirectUrl);
      } else {
        this.router.navigate([
          user?.role === 'RECRUITER'
            ? '/recruiter/dashboard'
            : '/dashboard'
        ]);
      }
    },
    error: (e) => {
      console.error(e);

      this.error = 'Invalid credentials. Please check your email and password.';

      // 🔥 STOP LOADING
      this.loading = false;
    }
  });
}
}
