import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-applicant-dashboard',
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-layout">
      <div class="dashboard-main fade-in">

        <!-- Welcome -->
        <div class="welcome-banner">
          <div class="welcome-left">
            <div class="section-label">Welcome back</div>
            <h2>Hello, {{ auth.currentUser?.name?.split(' ')[0] }} 👋</h2>
            <p>Track your applications, discover new opportunities, and ace your assessments.</p>
          </div>
          <div class="welcome-actions">
            <a routerLink="/jobs" class="btn btn-primary">Browse Jobs</a>
            <a routerLink="/profile" class="btn btn-ghost">Update Profile</a>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ applications.length }}</div>
            <div class="stat-label">Total Applications</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ pending }}</div>
            <div class="stat-label">Under Review</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--amber)">{{ round2 }}</div>
            <div class="stat-label">Round 2 Eligible</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--teal)">{{ allJobs.length }}</div>
            <div class="stat-label">Jobs Available</div>
          </div>
        </div>

        <div class="dash-grid">
          <!-- Recent Applications -->
          <div class="card">
            <div class="card-head">
              <h4>Recent Applications</h4>
              <a routerLink="/my-applications" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div *ngIf="loading" style="padding:32px;text-align:center"><div class="spinner"></div></div>
            <div *ngIf="!loading && applications.length === 0" class="empty-state">
              <div class="empty-state-icon">📋</div>
              <h3>No applications yet</h3>
              <p>Start applying to jobs to see them here</p>
            </div>
            <div class="app-list" *ngIf="!loading">
              <div class="app-item" *ngFor="let app of applications.slice(0,5)">
                <div class="app-info">
                  <div class="app-title">{{ app.jobTitle || 'Job #' + app.jobId }}</div>
                  <div class="app-meta">Applied {{ formatDate(app.appliedAt) }}</div>
                </div>
                <span class="badge" [ngClass]="getBadgeClass(app.status)">{{ app.status || 'APPLIED' }}</span>
              </div>
            </div>
          </div>

          <!-- Recommended Jobs -->
          <div class="card">
            <div class="card-head">
              <h4>Latest Openings</h4>
              <a routerLink="/jobs" class="btn btn-ghost btn-sm">See All</a>
            </div>
            <div *ngIf="jobsLoading" style="padding:32px;text-align:center"><div class="spinner"></div></div>
            <div class="job-list" *ngIf="!jobsLoading">
              <div class="job-item" *ngFor="let job of allJobs.slice(0,4)" (click)="goToJob(job.id)">
                <div class="job-icon">💼</div>
                <div class="job-info">
                  <div class="job-title">{{ job.title }}</div>
                  <div class="job-meta">{{ job.location }} · {{ job.jobType }}</div>
                </div>
                <div class="job-salary">{{ job.salaryRange }}</div>
              </div>
              <div *ngIf="allJobs.length === 0" class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No jobs posted yet</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { padding: 32px 40px; max-width: 1200px; margin: 0 auto; }
    .welcome-banner {
      display: flex; align-items: center; justify-content: space-between;
      background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.15);
      border-radius: var(--radius-lg); padding: 32px 36px;
      margin-bottom: 28px;
      position: relative; overflow: hidden;
    }
    .welcome-banner::before {
      content: ''; position: absolute; right: -40px; top: -40px;
      width: 200px; height: 200px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,229,195,0.08), transparent 70%);
    }
    .welcome-left h2 { font-size: 1.8rem; margin: 6px 0 8px; }
    .welcome-left p { color: var(--text-secondary); font-size: 14px; }
    .welcome-actions { display: flex; gap: 10px; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }

    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card-head h4 { font-size: 1rem; }

    .app-list { display: flex; flex-direction: column; gap: 2px; }
    .app-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border-radius: var(--radius-sm);
      transition: var(--transition); cursor: default;
    }
    .app-item:hover { background: var(--bg-elevated); }
    .app-title { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
    .app-meta { font-size: 12px; color: var(--text-muted); }

    .job-list { display: flex; flex-direction: column; gap: 4px; }
    .job-item {
      display: flex; align-items: center; gap: 14px;
      padding: 12px 14px; border-radius: var(--radius-sm);
      cursor: pointer; transition: var(--transition);
    }
    .job-item:hover { background: var(--bg-elevated); }
    .job-icon { font-size: 20px; flex-shrink: 0; }
    .job-info { flex: 1; }
    .job-title { font-size: 14px; font-weight: 500; margin-bottom: 2px; }
    .job-meta { font-size: 12px; color: var(--text-muted); }
    .job-salary { font-size: 12px; color: var(--teal); font-weight: 500; white-space: nowrap; }

    @media(max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .dash-grid { grid-template-columns: 1fr; }
      .welcome-banner { flex-direction: column; gap: 20px; }
    }
  `]
})
export class ApplicantDashboardComponent implements OnInit {
  applications: any[] = [];
  allJobs: any[] = [];
  loading = true; jobsLoading = true;

  get pending() { return this.applications.filter(a => !a.status || a.status === 'APPLIED').length; }
  get round2() { return this.applications.filter(a => a.round1Status === 'SELECTED').length; }

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getMyApplications().subscribe({
      next: (data) => {
        this.applications = (data || []).map((app: any) => ({
          ...app,
          jobTitle: app.title || app.jobTitle || '',
          status: app.round1_status || app.status || 'APPLIED',
          round1Status: app.round1_status || app.status || 'APPLIED',
          appliedAt: app.applied_at || app.appliedAt || ''
        }));
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
    this.api.getAllJobs().subscribe({
      next: (data) => { this.allJobs = data || []; this.jobsLoading = false; },
      error: () => { this.jobsLoading = false; }
    });
  }

  goToJob(id: number) { this.router.navigate(['/jobs', id]); }

  formatDate(d: string): string {
    if (!d) return 'recently';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  getBadgeClass(status: string): string {
    const map: any = { APPLIED: 'badge-teal', SELECTED: 'badge-amber', REJECTED: 'badge-red', ROUND2: 'badge-purple' };
    return map[status] || 'badge-teal';
  }
}
