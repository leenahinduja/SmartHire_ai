import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  standalone: true,
    imports: [ReactiveFormsModule],
  selector: 'app-reset-password',
  template: `
    <div class="center-page">
      <div class="fp-card">
        <h3>Set New Password</h3>

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>
        <div class="alert alert-success" *ngIf="success">{{ success }}</div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <input type="password" placeholder="New Password" formControlName="password" />
          <input type="password" placeholder="Confirm Password" formControlName="confirmPassword" />

          <button type="submit">Update Password</button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  error = '';
  success = '';

  form = this.fb.group({
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required]
  });

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.error = "Invalid link";
      return;
    }

    this.auth.validateToken(this.token).subscribe({
      next: () => {},
      error: () => this.error = "Token expired or invalid"
    });
  }

  submit() {
    if (this.form.invalid) return;

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    this.auth.resetPassword({
      token: this.token,
      password: this.form.value.password!
    }).subscribe({
      next: () => {
        this.success = "Password updated successfully!";
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: () => this.error = "Error updating password"
    });
  }
}