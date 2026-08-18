import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-brand" (click)="goToLanding()" style="cursor: pointer;">
        <span class="brand-icon">⬡</span>
        <span class="brand-text">SmartHire<span class="brand-ai">AI</span></span>
      </div>

      <div class="nav-links" *ngIf="auth.isLoggedIn">
        <ng-container *ngIf="auth.isApplicant">
          <a routerLink="/jobs" routerLinkActive="active">Jobs</a>
          <a routerLink="/my-applications" routerLinkActive="active">Applications</a>
          <a routerLink="/profile" routerLinkActive="active">Profile</a>
        </ng-container>
        <ng-container *ngIf="auth.isRecruiter">
          <a routerLink="/recruiter/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/recruiter/jobs/create" routerLinkActive="active">Post Job</a>
        </ng-container>
      </div>

      <div class="nav-actions">
        <ng-container *ngIf="auth.isLoggedIn; else guestButtons">
          <div class="user-chip">
            <div class="user-avatar">{{ initials }}</div>
            <div class="user-info">
              <span class="user-name">{{ auth.currentUser?.name }}</span>
              <span class="user-role badge" [class.badge-teal]="auth.isApplicant" [class.badge-amber]="auth.isRecruiter">
                {{ auth.currentUser?.role }}
              </span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
        </ng-container>
        <ng-template #guestButtons>
          <a routerLink="/login" class="btn btn-ghost btn-sm">Login</a>
          <a routerLink="/register" class="btn btn-primary btn-sm">Get Started</a>
        </ng-template>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      display: flex; align-items: center;
      padding: 0 32px; height: 64px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; z-index: 100;
      gap: 32px;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 10px;
      cursor: pointer; text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon { color: var(--teal); font-size: 22px; }
    .brand-text {
      font-family: var(--font-display); font-size: 1.2rem;
      font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;
    }
    .brand-ai { color: var(--teal); }
    .nav-links { display: flex; align-items: center; gap: 4px; flex: 1; }
    .nav-links a {
      padding: 6px 14px; border-radius: var(--radius-sm);
      text-decoration: none; font-size: 14px; font-weight: 500;
      color: var(--text-secondary);
      transition: var(--transition);
    }
    .nav-links a:hover, .nav-links a.active {
      color: var(--text-primary); background: var(--bg-elevated);
    }
    .nav-links a.active { color: var(--teal); }
    .nav-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
    .user-chip { display: flex; align-items: center; gap: 10px; }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--teal);
    }
    .user-info { display: flex; flex-direction: column; gap: 1px; }
    .user-name { font-size: 13px; font-weight: 600; }
  `]
})
export class NavbarComponent {
  constructor(public auth: AuthService, private router: Router) {}
  get initials(): string {
    const name = this.auth.currentUser?.name || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  logout() { this.auth.logout(); }
  goToLanding() { this.router.navigate(['/']); }
}
