import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-job-detail',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div *ngIf="loading" style="padding:80px;text-align:center"><div class="spinner"></div></div>

      <div *ngIf="!loading && job" class="fade-in">
        <button class="btn btn-ghost btn-sm" (click)="back()" style="margin-bottom:24px">← Back to Jobs</button>

        <div class="job-layout">
          <!-- Main Content -->
          <div class="job-main">
            <div class="job-hero card card-glow">
              <div class="job-hero-header">
                <div class="company-logo-lg">{{ job.title?.charAt(0) }}</div>
                <div class="job-hero-info">
                  <h2>{{ job.title }}</h2>
                  <div class="hero-meta">
                    <span>📍 {{ job.location }}</span>
                    <span>💰 {{ job.salaryRange }}</span>
                    <span class="badge badge-teal">{{ job.jobType || 'Full Time' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-top:20px">
              <h4 style="margin-bottom:16px">Job Description</h4>
              <p class="job-full-desc">{{ job.description }}</p>
            </div>

            <div class="card" style="margin-top:20px">
              <h4 style="margin-bottom:14px">Required Skills</h4>
              <div class="tags">
                <span class="tag" *ngFor="let s of getSkills(job.requiredSkills)">{{ s }}</span>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="job-sidebar">
            <!-- Apply Card -->
            <div class="apply-card card card-glow" *ngIf="auth.isApplicant">
              <div *ngIf="!applied && !applyLoading">
                <h4 style="margin-bottom:8px">Ready to Apply?</h4>
                <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px">
                  Submit your application in one click. Make sure your profile and resume are up to date.
                </p>
                <div class="alert alert-error" *ngIf="error" style="margin-bottom:16px">{{ error }}</div>
               <button 
  class="btn btn-primary btn-full btn-lg" 
  (click)="apply()"
  [disabled]="applyLoading || applied"
>
  {{ applyLoading ? 'Applying...' : applied ? 'Applied' : 'Apply Now' }}
</button>
                <a routerLink="/profile" class="btn btn-ghost btn-full" style="margin-top:8px">Update Profile First</a>
              </div>
              <div *ngIf="applyLoading" style="text-align:center;padding:20px"><div class="spinner"></div></div>
              <div *ngIf="applied && !error" style="text-align:center;padding:20px">
                <div style="font-size:40px;margin-bottom:12px">✅</div>
                <h4>Application Submitted!</h4>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:8px">We'll notify you of any updates</p>
                <a routerLink="/my-applications" class="btn btn-outline btn-full" style="margin-top:16px">View My Applications</a>
              </div>
              <div *ngIf="applied && error" style="text-align:center;padding:20px">
                <div style="font-size:40px;margin-bottom:12px">⚠️</div>
                <h4>Already Applied</h4>
                <p style="font-size:13px;color:var(--text-secondary);margin-top:8px">{{ error }}</p>
                <a routerLink="/my-applications" class="btn btn-outline btn-full" style="margin-top:16px">View My Applications</a>
              </div>
            </div>

            <!-- Job Info -->
            <div class="card" style="margin-top:16px">
              <h4 style="margin-bottom:16px">Job Details</h4>
              <div class="info-list">
                <div class="info-row">
                  <span class="info-label">Job Type</span>
                  <span class="info-value">{{ job.jobType || 'Full Time' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Location</span>
                  <span class="info-value">{{ job.location }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Salary Range</span>
                  <span class="info-value" style="color:var(--teal)">{{ job.salaryRange || 'Competitive' }}</span>
                </div>
                <div class="info-row" *ngIf="job.deadline">
                  <span class="info-label">Application Deadline</span>
                  <span class="info-value" style="color:var(--amber)">{{ formatDate(job.deadline) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Posted On</span>
                  <span class="info-value">{{ formatDate(job.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Hiring Process -->
            <div class="card" style="margin-top:16px">
              <h4 style="margin-bottom:16px">Hiring Process</h4>
              <div class="process-steps">
                <div class="process-step">
                  <div class="step-num">1</div>
                  <div><div class="step-title">ATS Screening</div><div class="step-sub">AI resume match</div></div>
                </div>
                <div class="step-connector"></div>
                <div class="process-step">
                  <div class="step-num">2</div>
                  <div><div class="step-title">Round 1 Review</div><div class="step-sub">Recruiter shortlist</div></div>
                </div>
                <div class="step-connector"></div>
                <div class="process-step">
                  <div class="step-num">3</div>
                  <div><div class="step-title">MCQ Assessment</div><div class="step-sub">AI-powered test</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 1100px; margin: 0 auto; }
    .job-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; }

    .job-hero { padding: 28px; }
    .job-hero-header { display: flex; gap: 18px; align-items: flex-start; }
    .company-logo-lg {
      width: 64px; height: 64px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--teal-glow), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.25);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--teal);
      flex-shrink: 0;
    }
    .job-hero-info h2 { font-size: 1.6rem; margin-bottom: 10px; }
    .hero-meta { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; font-size: 13px; color: var(--text-secondary); }

    .job-full-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.8; white-space: pre-line; }

    .apply-card { padding: 24px; }

    .info-list { display: flex; flex-direction: column; gap: 14px; }
    .info-row { display: flex; justify-content: space-between; align-items: center; }
    .info-label { font-size: 12px; color: var(--text-muted); }
    .info-value { font-size: 13px; font-weight: 500; }

    .process-steps { display: flex; flex-direction: column; gap: 0; }
    .process-step { display: flex; gap: 14px; align-items: flex-start; }
    .step-num {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; color: var(--teal);
    }
    .step-title { font-size: 13px; font-weight: 600; }
    .step-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
    .step-connector {
      width: 1px; height: 20px; background: var(--border);
      margin-left: 13px; margin: 4px 0 4px 13px;
    }

    @media(max-width:900px) { .job-layout { grid-template-columns: 1fr; } }
  `]
})
export class JobDetailComponent implements OnInit {
  job: any = null;
  loading = true; applyLoading = false; applied = false;
  success = ''; error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    public auth: AuthService
  ) {}

  ngOnInit() {
  const id = Number(this.route.snapshot.paramMap.get('id'));

  // Job load
  this.api.getJobById(id).subscribe({
    next: (data) => { this.job = data; this.loading = false; },
    error: () => { this.loading = false; }
  });

  // 🔥 ADD THIS (IMPORTANT)
  this.api.getApplicationStatus(id).subscribe({
    next: (res) => {
      if (res && Object.keys(res).length > 0) {
        this.applied = true;
      }
    },
    error: () => {}
  });
}

  apply() {
  // 🔒 Prevent multiple clicks
  if (this.applyLoading || this.applied) return;

  this.applyLoading = true; 
  this.error = '';
  this.success = '';
  
  this.api.applyJob(this.job.id).subscribe({
    next: (response) => { 
      this.applied = true; 
      this.success = 'Application submitted successfully! ✅';
      this.applyLoading = false;
      console.log('Application submitted:', response);
    },

    error: (e) => { 
      this.applyLoading = false;

      if (e.status === 400) {
        // ❗ Already applied case
        const errMsg = e.error?.message || e.error || 'Already applied for this job';
        this.error = errMsg;

        // ❌ DO NOT mark applied = true here

      } else {
        // ❗ Other errors
        const errMsg = e.error?.message || e.error?.msg || 
          (typeof e.error === 'string' ? e.error : 'Failed to apply. Please try again.');
        this.error = errMsg;
      }
    }
  });
}

  back() { this.router.navigate(['/jobs']); }

  getSkills(s: string): string[] {
    return (s || '').split(',').map(x => x.trim()).filter(Boolean);
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
