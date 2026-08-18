import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-brand">
          <span class="brand-icon">⬡</span>
          <span class="brand-text">SmartHire<span class="brand-ai">AI</span></span>
        </div>
        <div class="auth-tagline">
          <h2>Join the future of hiring</h2>
          <p>Whether you're hiring or job hunting, SmartHireAI streamlines every step.</p>
        </div>
        <div class="role-cards">
          <div class="role-card" [class.active]="selectedRole === 'RECRUITER'">
            <div class="role-icon">🏢</div>
            <div class="role-title">Recruiter</div>
            <div class="role-desc">Post jobs, screen candidates, manage hiring rounds</div>
          </div>
          <div class="role-card" [class.active]="selectedRole === 'APPLICANT'">
            <div class="role-icon">👤</div>
            <div class="role-title">Applicant</div>
            <div class="role-desc">Browse jobs, apply, track your application status</div>
          </div>
        </div>
      </div>

      
      <div class="auth-right">
        <div class="auth-form-card fade-in">
          <div class="auth-header">
            <h3>Create account</h3>
            <p>Start your SmartHireAI journey today</p>
          </div>

          <div class="alert alert-success" *ngIf="success">{{ success }}</div>
          <div class="alert alert-error" *ngIf="error">{{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-control" formControlName="name" placeholder="John Doe" />
            </div>
            <div class="form-group" style="margin-top:14px">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" formControlName="email" placeholder="you@email.com" />
            </div>
            <div class="form-group" style="margin-top:14px">
              <label class="form-label">Password</label>
              <input type="password" class="form-control" formControlName="password" placeholder="Min 6 characters" />
            </div>
            <div class="form-group" style="margin-top:14px">
              <label class="form-label">I am a...</label>
              <div class="role-toggle">
                <button type="button" class="role-btn" [class.active]="form.value.role === 'APPLICANT'"
                  (click)="setRole('APPLICANT')">👤 Applicant</button>
                <button type="button" class="role-btn" [class.active]="form.value.role === 'RECRUITER'"
                  (click)="setRole('RECRUITER')">🏢 Recruiter</button>
              </div>
            </div>
            <br>
            <button type="submit" class="btn btn-primary btn-full">
              <span *ngIf="!loading">Create Account</span>
              <div *ngIf="loading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
            </button>
          </form>

          <div class="auth-footer">
            Already have an account? <a routerLink="/login">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }
    .auth-left {
      flex: 1; background: var(--bg-surface); border-right: 1px solid var(--border);
      padding: 60px; display: flex; flex-direction: column; gap: 40px;
    }
    .auth-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { color: var(--teal); font-size: 24px; }
    .brand-text { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; }
    .brand-ai { color: var(--teal); }
    .auth-tagline h2 { font-size: 2rem; line-height: 1.3; margin-bottom: 12px; }
    .auth-tagline p { color: var(--text-secondary); font-size: 1rem; }
    .role-cards { display: flex; flex-direction: column; gap: 12px; }
    .role-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 16px 20px;
      display: flex; align-items: flex-start; gap: 14px;
      transition: var(--transition);
    }
    .role-card.active { border-color: var(--teal); background: var(--teal-glow); }
    .role-icon { font-size: 24px; }
    .role-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .role-desc { font-size: 12px; color: var(--text-muted); }

    .auth-right {
      width: 480px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; padding: 40px;
    }
    .auth-form-card { width: 100%; max-width: 380px; }
    .auth-header { margin-bottom: 28px; }
    .auth-header h3 { font-size: 1.6rem; margin-bottom: 4px; }
    .auth-header p { color: var(--text-secondary); font-size: 14px; }

    .role-toggle { display: flex; gap: 8px; }
    .role-btn {
      flex: 1; padding: 10px; border-radius: var(--radius-sm);
      background: var(--bg-elevated); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: var(--transition);
    }
    .role-btn.active {
      background: var(--teal-glow); border-color: var(--teal); color: var(--teal);
    }
    .auth-footer { margin-top: 24px; text-align: center; font-size: 13px; color: var(--text-muted); }
    .auth-footer a { color: var(--teal); text-decoration: none; }
    @media(max-width:768px) { .auth-left { display: none; } .auth-right { width: 100%; } }
  `]
})
export class RegisterComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['APPLICANT']
  });
  error = ''; success = ''; loading = false;

  get selectedRole() { return this.form.value.role; }

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) { }

  setRole(role: string) { this.form.patchValue({ role }); }

  submit() {
    alert("Button clicked");   // 🔥 add this

    console.log('hi')

    this.loading = true;
    this.error = '';
    this.success = '';

    console.log("Register Data:", this.form.value); // 🔍 debug

    this.auth.register(this.form.value as any).subscribe({
      next: (res: any) => {
        console.log("Register Success:", res);

        this.loading = false; // 🔥 IMPORTANT

        this.success = 'Account created successfully! Redirecting...';

        // redirect after 1.5 sec
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (e) => {
        console.error("Register Error:", e);

        this.loading = false; // 🔥 IMPORTANT

        this.error =
          e.error?.message ||
          'Registration failed. Email might already exist.';
      }
    });
  }
}
