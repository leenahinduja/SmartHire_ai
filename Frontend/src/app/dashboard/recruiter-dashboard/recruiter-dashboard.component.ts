import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recruiter-dashboard',
  template: `
    <app-navbar></app-navbar>
    <div class="dashboard-layout">
      <div class="fade-in">

        <!-- Header -->
        <div class="dash-header">
          <div>
            <div class="section-label">Recruiter Portal</div>
            <h2>Hiring Dashboard</h2>
            <p class="sub">Manage your job postings and candidate pipeline</p>
          </div>
          <a routerLink="/recruiter/jobs/create" class="btn btn-primary btn-lg">
            + Post New Job
          </a>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ jobs.length }}</div>
            <div class="stat-label">Active Jobs</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--amber)">{{ totalApplicants }}</div>
            <div class="stat-label">Total Applicants</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--purple)">{{ jobs.length }}</div>
            <div class="stat-label">Positions Open</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--teal)">AI</div>
            <div class="stat-label">ATS Screening</div>
          </div>
        </div>

        <!-- Job Cards -->
        <div class="section-label" style="margin-bottom:16px">Your Job Postings</div>
        <div *ngIf="loading" style="padding:60px;text-align:center"><div class="spinner"></div></div>

        <div *ngIf="!loading && jobs.length === 0" class="empty-state card">
          <div class="empty-state-icon">📋</div>
          <h3>No jobs posted yet</h3>
          <p>Create your first job posting to start receiving applications</p>
          <a routerLink="/recruiter/jobs/create" class="btn btn-primary" style="margin-top:16px">Post a Job</a>
        </div>

        <div class="jobs-grid" *ngIf="!loading">
          <div class="job-card card" *ngFor="let job of jobs">
            <div class="job-card-head">
              <div class="job-tag">{{ job.jobType || 'Full Time' }}</div>
              <div class="job-date">{{ formatDate(job.createdAt) }}</div>
            </div>
            <h4 class="job-title">{{ job.title }}</h4>
            <div class="job-meta-row">
              <span>📍 {{ job.location }}</span>
              <span>💰 {{ job.salaryRange }}</span>
            </div>
            <div class="job-desc">{{ job.description | slice:0:100 }}...</div>
            <div class="job-skills tags" style="margin:12px 0">
              <span class="tag" *ngFor="let s of (job.requiredSkills || '').split(',').slice(0,3)">{{ s.trim() }}</span>
            </div>
            <div class="job-card-footer">
              <div class="applicant-count" (click)="viewApplicants(job.id)">
                <span class="count-badge">{{ job.applicantCount || 0 }}</span>
                Applicants
              </div>
              <div class="job-actions" style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn btn-ghost btn-sm" (click)="viewApplicants(job.id)">Pipeline</button>
                <button class="btn btn-outline btn-sm" (click)="manageMcq(job.id)">MCQ</button>
                <button class="btn btn-outline btn-sm" style="color:#38bdf8;border-color:#38bdf8" (click)="manageCoding(job.id)">Coding</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout { padding: 32px 40px; max-width: 1200px; margin: 0 auto; }
    .dash-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px;
    }
    .dash-header h2 { font-size: 2rem; margin: 6px 0 8px; }
    .sub { color: var(--text-secondary); font-size: 14px; }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }

    .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .job-card { padding: 24px; transition: var(--transition); }
    .job-card:hover { border-color: rgba(0,229,195,0.2); transform: translateY(-2px); box-shadow: var(--shadow-glow); }

    .job-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .job-tag {
      background: var(--amber-glow); color: var(--amber);
      border: 1px solid rgba(255,179,71,0.25);
      border-radius: 100px; padding: 3px 10px;
      font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    }
    .job-date { font-size: 11px; color: var(--text-muted); }
    .job-title { font-size: 1.05rem; margin-bottom: 10px; }
    .job-meta-row { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; }
    .job-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; }

    .job-card-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 14px; border-top: 1px solid var(--border); margin-top: 4px;
    }
    .applicant-count {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--text-secondary); cursor: pointer;
    }
    .applicant-count:hover { color: var(--text-primary); }
    .count-badge {
      background: var(--teal-glow); color: var(--teal);
      border: 1px solid rgba(0,229,195,0.25);
      border-radius: 100px; padding: 2px 10px;
      font-size: 12px; font-weight: 700;
    }
    .job-actions { display: flex; gap: 8px; }
    @media(max-width:900px) {
      .stats-row { grid-template-columns: repeat(2,1fr); }
      .dash-header { flex-direction: column; gap: 16px; }
    }
  `]
})
export class RecruiterDashboardComponent implements OnInit {
  jobs: any[] = [];
  loading = true;
  totalApplicants = 0;

  constructor(public auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getAllJobs().subscribe({
      next: (d) => {
        this.jobs = d || [];
        this.totalApplicants = this.jobs.reduce((acc, j) => acc + (j.applicantCount || 0), 0);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  viewApplicants(jobId: number) { this.router.navigate(['/recruiter/applicants', jobId]); }
  manageMcq(jobId: number) { this.router.navigate(['/recruiter/mcq', jobId]); }
  manageCoding(jobId: number) { this.router.navigate(['/recruiter/coding', jobId]); }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
