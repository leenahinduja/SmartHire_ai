import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-applications',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div class="fade-in">
        <div class="page-header">
          <div>
            <div class="section-label">Applicant</div>
            <h2>My Applications</h2>
          </div>
          <a routerLink="/jobs" class="btn btn-primary">Browse More Jobs</a>
        </div>

        <!-- Status Filter -->
        <div class="filter-row">
          <button class="filter-btn" [class.active]="filter === 'all'" (click)="filter='all'">All ({{ applications.length }})</button>
          <button class="filter-btn" [class.active]="filter === 'APPLIED'" (click)="filter='APPLIED'">Applied</button>
          <button class="filter-btn" [class.active]="filter === 'SELECTED'" (click)="filter='SELECTED'">Selected</button>
          <button class="filter-btn" [class.active]="filter === 'REJECTED'" (click)="filter='REJECTED'">Rejected</button>
        </div>

        <div *ngIf="loading" style="padding:80px;text-align:center"><div class="spinner"></div></div>

        <div *ngIf="!loading && filtered.length === 0" class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3>No applications found</h3>
          <p>Start applying to jobs to track your progress here</p>
          <a routerLink="/jobs" class="btn btn-primary" style="margin-top:16px">Browse Jobs</a>
        </div>

        <div class="apps-list" *ngIf="!loading">
          <div class="app-card card" *ngFor="let app of filtered">
            <div class="app-card-header">
              <div class="job-logo">{{ (app.jobTitle || 'J').charAt(0) }}</div>
              <div class="app-info">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div>
                    <h4 style="margin-bottom: 8px;">{{ app.jobTitle || 'Job #' + app.jobId }}</h4>
                    <div class="app-meta">
                      <span>📍 {{ app.location || 'Location N/A' }}</span>
                      <span>💼 {{ app.jobType || 'Full Time' }}</span>
                      <span *ngIf="app.salaryRange">💰 {{ app.salaryRange }}</span>
                    </div>
                  </div>
                  <span class="badge" [ngClass]="getBadgeClass(app.status)" style="white-space: nowrap;">{{ app.status || 'APPLIED' }}</span>
                </div>
              </div>
            </div>

            <!-- Application Details -->
            <div class="app-details" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
              <div class="detail-item">
                <div class="detail-label">Applied On</div>
                <div class="detail-value">{{ formatDate(app.appliedAt) }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Current Stage</div>
                <div class="detail-value" [style.color]="getStageColor(app.status)">{{ app.currentStageText }}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Job ID</div>
                <div class="detail-value">#{{ app.jobId }}</div>
              </div>
            </div>

            <!-- Status Timeline with 6 Steps: Applied -> ATS Review -> MCQ Test -> Coding Round -> Interview Round -> Selected -->
            <div class="status-timeline">
              <div class="timeline-step" [class.done]="true">
                <div class="t-dot"></div>
                <div class="t-label">Applied</div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-step" [class.done]="app.round1_status === 'SELECTED'" [class.rejected]="app.round1_status === 'REJECTED'">
                <div class="t-dot"></div>
                <div class="t-label">ATS Review</div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-step" [class.done]="app.round2_status === 'SELECTED'" [class.rejected]="app.round2_status === 'REJECTED'" [class.active]="app.round1_status === 'SELECTED' && app.round2_status !== 'SELECTED' && app.round2_status !== 'REJECTED'">
                <div class="t-dot"></div>
                <div class="t-label">MCQ Test</div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-step" [class.done]="app.round3_status === 'SELECTED'" [class.rejected]="app.round3_status === 'REJECTED'" [class.active]="app.round2_status === 'SELECTED' && app.round3_status !== 'SELECTED' && app.round3_status !== 'REJECTED'">
                <div class="t-dot"></div>
                <div class="t-label">Coding Round</div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-step" [class.done]="app.round4_status === 'SELECTED'" [class.rejected]="app.round4_status === 'REJECTED'" [class.active]="app.round3_status === 'SELECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED'">
                <div class="t-dot"></div>
                <div class="t-label">Interview Round</div>
              </div>
              <div class="timeline-line"></div>
              <div class="timeline-step" [class.done]="app.round4_status === 'SELECTED'">
                <div class="t-dot"></div>
                <div class="t-label">Selected</div>
              </div>
            </div>

            <!-- 1. LIVE URGENT INTERVIEW CALLED (2 MIN WINDOW) -->
            <div *ngIf="app.round3_status === 'SELECTED' && app.round4_status === 'IN_INTERVIEW' && app.meeting_link && app.round4_status !== 'COMPLETED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED'" 
                 style="margin-bottom: 16px; padding: 18px 20px; background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
              <div>
                <div style="font-weight: 700; color: #f87171; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                  <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:#ef4444;"></span>
                  🚨 YOUR INTERVIEW IS STARTING NOW!
                </div>
                <div style="font-size: 13px; color: #fca5a5; margin-top: 4px;">
                  The interviewer is waiting for you in the meeting. <b>Please join within 2 minutes!</b>
                </div>
              </div>
              <a [href]="app.meeting_link" target="_blank" class="btn btn-primary" style="background: #dc2626; border-color: #dc2626; text-decoration: none; font-weight: 800; padding: 10px 22px;">
                🚀 JOIN LIVE INTERVIEW (2 MINS)
              </a>
            </div>

            <!-- 2. TIME SLOT ANNOUNCED (AWAITING TURN) -->
            <div *ngIf="app.round3_status === 'SELECTED' && app.round4_status === 'SLOT_SCHEDULED' && app.round4_status !== 'COMPLETED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED'" 
                 style="margin-bottom: 16px; padding: 14px 18px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="font-weight: 600; color: #a78bfa; font-size: 14px;">📅 Round 4 Interview Slot Confirmed</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Please keep this dashboard open. When your turn arrives, your live join link will appear right here.
                </div>
              </div>
              <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid #8b5cf6; padding: 6px 12px;">
                ⏳ Awaiting Your Turn
              </span>
            </div>

            <!-- 3. STANDARD SCHEDULED MEETING (IF ACTIVE) -->
            <div *ngIf="app.round3_status === 'SELECTED' && app.meeting_link && app.round4_status !== 'IN_INTERVIEW' && app.round4_status !== 'SLOT_SCHEDULED' && app.round4_status !== 'REJECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'COMPLETED' && app.meeting_link !== 'AWAITING_CALL'" 
                 style="margin-bottom: 16px; padding: 14px 18px; background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="font-weight: 600; color: #a78bfa; font-size: 14px;">📅 Live Interview Scheduled</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Time: <b>{{ formatDateTime(app.meeting_time) }}</b>
                </div>
              </div>
              <a [href]="app.meeting_link" target="_blank" class="btn btn-primary btn-sm" style="background: #8b5cf6; border-color: #8b5cf6; text-decoration: none;">
                🎥 Join Meeting
              </a>
            </div>

            <!-- 4. INTERVIEW COMPLETED & LINK EXPIRED -->
            <div *ngIf="app.round4_status === 'COMPLETED' || (app.meeting_link && (app.round4_status === 'SELECTED' || app.round4_status === 'REJECTED'))" 
                 style="margin-bottom: 16px; padding: 14px 18px; background: rgba(100, 116, 139, 0.15); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="font-weight: 600; color: #cbd5e1; font-size: 14px;">🔒 Interview Session Completed</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  Your interview session has been completed and marked done. The meeting link is expired.
                </div>
              </div>
              <span class="badge" style="background: rgba(100, 116, 139, 0.25); color: #cbd5e1; border: 1px solid #64748b; padding: 6px 12px;">
                🔒 Link Expired
              </span>
            </div>

            <div class="app-card-footer">
              <button class="btn btn-ghost btn-sm" (click)="viewJob(app.jobId)">👁️ View Job Details</button>
              
              <!-- Take MCQ Test -->
              <button class="btn btn-primary btn-sm" *ngIf="app.round1_status === 'SELECTED' && app.round2_status !== 'SELECTED' && app.round2_status !== 'REJECTED'" (click)="takeTest(app.jobId)">
                🎯 Take MCQ Test
              </button>
              
              <!-- Take Coding Test -->
              <button class="btn btn-primary btn-sm" style="background: #0284c7; border-color: #0284c7;" *ngIf="app.round2_status === 'SELECTED' && app.round3_status !== 'SELECTED' && app.round3_status !== 'REJECTED'" (click)="takeCodingTest(app.jobId)">
                💻 Take Coding Test
              </button>

              <!-- Final Selected / Offer -->
              <button class="btn btn-outline btn-sm" style="color: var(--teal); border-color: var(--teal);" *ngIf="app.round4_status === 'SELECTED'">
                🎉 Selected & Hired!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 950px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .page-header h2 { font-size: 2rem; margin-top: 6px; }

    .filter-row { display: flex; gap: 8px; margin-bottom: 24px; }
    .filter-btn {
      padding: 7px 18px; border-radius: 100px;
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer;
      transition: var(--transition);
    }
    .filter-btn:hover { border-color: var(--border-light); }
    .filter-btn.active { background: var(--teal-glow); border-color: var(--teal); color: var(--teal); }

    .apps-list { display: flex; flex-direction: column; gap: 16px; }
    .app-card { padding: 24px; transition: var(--transition); border: 1px solid var(--border); }
    .app-card:hover { border-color: rgba(0,229,195,0.3); box-shadow: 0 4px 12px rgba(0,229,195,0.08); transform: translateY(-2px); }
    .app-card-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
    .job-logo {
      width: 48px; height: 48px; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--teal-glow), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.2);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--teal);
      flex-shrink: 0;
    }
    .app-info { flex: 1; }
    .app-info h4 { font-size: 1.1rem; margin-bottom: 6px; color: var(--text-primary); font-weight: 600; }
    .app-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
    
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
    .detail-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }

    .status-timeline {
      display: flex; align-items: center;
      background: linear-gradient(90deg, rgba(0,229,195,0.05), transparent);
      border-radius: var(--radius-sm);
      padding: 16px 14px; margin-bottom: 18px;
      overflow-x: auto;
    }
    .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 55px; }
    .t-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: var(--border); border: 2px solid var(--bg-card);
      transition: var(--transition); box-shadow: 0 0 0 3px var(--bg-card);
    }
    .timeline-step.done .t-dot { 
      background: var(--teal); 
      border-color: var(--teal); 
      box-shadow: 0 0 12px rgba(0,229,195,0.5); 
    }
    .timeline-step.active .t-dot { 
      background: var(--amber); 
      border-color: var(--amber); 
      box-shadow: 0 0 12px rgba(255,179,71,0.5);
      animation: pulse 2s infinite;
    }
    .timeline-step.rejected .t-dot { 
      background: var(--red); 
      border-color: var(--red); 
      box-shadow: 0 0 12px rgba(255,71,87,0.5);
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
    .t-label { font-size: 11px; color: var(--text-muted); white-space: nowrap; font-weight: 500; }
    .timeline-line { flex: 1; min-width: 16px; height: 2px; background: linear-gradient(90deg, var(--border), transparent); margin: 0 2px; margin-bottom: 22px; }

    .app-card-footer { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
  `]
})
export class MyApplicationsComponent implements OnInit {
  applications: any[] = [];
  loading = true;
  filter = 'all';

  get filtered(): any[] {
    if (this.filter === 'all') return this.applications;
    return this.applications.filter(a => {
      if (this.filter === 'SELECTED') return a.round4_status === 'SELECTED';
      if (this.filter === 'REJECTED') return a.round1_status === 'REJECTED' || a.round2_status === 'REJECTED' || a.round3_status === 'REJECTED' || a.round4_status === 'REJECTED';
      if (this.filter === 'APPLIED') return a.round4_status !== 'SELECTED' && a.round1_status !== 'REJECTED' && a.round2_status !== 'REJECTED' && a.round3_status !== 'REJECTED' && a.round4_status !== 'REJECTED';
      return true;
    });
  }

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getMyApplications().subscribe({
      next: (d) => { 
        console.log('Applications from backend:', d);
        this.applications = (d || []).map((app: any) => {
          let r1 = app.round1_status || 'PENDING';
          let r2 = app.round2_status || 'PENDING';
          let r3 = app.round3_status || 'PENDING';
          let r4 = app.round4_status || 'PENDING';

          let computedStatus = 'APPLIED';
          let currentStageText = 'ATS Review';

          if (r4 === 'SELECTED') {
            computedStatus = 'SELECTED';
            currentStageText = 'SELECTED';
          } else if (r1 === 'REJECTED' || r2 === 'REJECTED' || r3 === 'REJECTED' || r4 === 'REJECTED') {
            computedStatus = 'REJECTED';
            currentStageText = 'REJECTED';
          } else if (r3 === 'SELECTED') {
            computedStatus = 'INTERVIEW';
            currentStageText = app.meeting_link ? 'Interview Scheduled' : 'Interview Round';
          } else if (r2 === 'SELECTED') {
            computedStatus = 'CODING';
            currentStageText = 'Coding Round';
          } else if (r1 === 'SELECTED') {
            computedStatus = 'MCQ';
            currentStageText = 'MCQ Test';
          }

          const mappedApp = {
            ...app,
            jobId: app.jobId || app.job_id || app.id,
            jobTitle: app.jobTitle || app.job_title || app.job?.title || app.title || '',
            location: app.location || app.job?.location || '',
            jobType: app.jobType || app.job_type || app.job?.jobType || app.type || 'Full Time',
            salaryRange: app.salaryRange || app.salary_range || app.job?.salaryRange || '',
            appliedAt: app.appliedAt || app.applied_at || app.createdAt || new Date().toISOString(),
            round1_status: r1,
            round2_status: r2,
            round3_status: r3,
            round4_status: r4,
            meeting_link: app.meeting_link || null,
            meeting_time: app.meeting_time || null,
            status: computedStatus,
            currentStageText: currentStageText
          };
          
          if (!mappedApp.jobTitle && mappedApp.jobId) {
            this.api.getJobById(mappedApp.jobId).subscribe({
              next: (job: any) => {
                mappedApp.jobTitle = job.title;
                mappedApp.location = job.location;
                mappedApp.jobType = job.jobType;
                mappedApp.salaryRange = job.salaryRange;
              },
              error: (err) => {
                mappedApp.jobTitle = `Job #${mappedApp.jobId}`;
              }
            });
          }
          
          return mappedApp;
        });
        this.loading = false; 
      },
      error: (err) => { 
        console.error('Error loading applications:', err);
        this.loading = false; 
      }
    });
  }

  viewJob(id: number) { this.router.navigate(['/jobs', id]); }
  takeTest(jobId: number) { this.router.navigate(['/mcq', jobId]); }
  takeCodingTest(jobId: number) { this.router.navigate(['/coding', jobId]); }

  getBadgeClass(s: string): string {
    const m: any = {
      APPLIED: 'badge-teal',
      MCQ: 'badge-purple',
      CODING: 'badge-teal',
      INTERVIEW: 'badge-purple',
      SELECTED: 'badge-amber',
      REJECTED: 'badge-red'
    };
    return m[s] || 'badge-teal';
  }

  getStageColor(status: string): string {
    if (status === 'SELECTED') return '#10b981';
    if (status === 'REJECTED') return '#ef4444';
    if (status === 'INTERVIEW') return '#8b5cf6';
    if (status === 'CODING') return '#0284c7';
    if (status === 'MCQ') return '#f59e0b';
    return 'var(--teal)';
  }

  formatDate(d: string): string {
    if (!d) return 'recently';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }

  formatDateTime(d: string): string {
    if (!d) return 'TBD';
    return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
