import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-job-create',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div class="form-page fade-in">
        <div class="form-header">
          <button class="btn btn-ghost btn-sm" (click)="back()">← Back</button>
          <div style="margin-top:16px">
            <div class="section-label">Recruiter</div>
            <h2>Post a New Job</h2>
            <p class="sub">Fill in the details to publish your job opening</p>
          </div>
        </div>

        <div class="form-body">
          <div class="alert alert-success" *ngIf="success">{{ success }}</div>
          <div class="alert alert-error" *ngIf="error">{{ error }}</div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="form-section">
              <div class="form-section-title">Basic Information</div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Job Title *</label>
                  <input class="form-control" formControlName="title" placeholder="e.g. Senior React Developer" />
                </div>
                <div class="form-group">
                  <label class="form-label">Job Type</label>
                  <select class="form-control" formControlName="jobType">
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Remote">Remote</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Location *</label>
                  <input class="form-control" formControlName="location" placeholder="e.g. Mumbai, Maharashtra" />
                </div>
                <div class="form-group">
                  <label class="form-label">Salary Range</label>
                  <input class="form-control" formControlName="salaryRange" placeholder="e.g. ₹8–12 LPA" />
                </div>
              </div>
              <div class="form-group" style="margin-top:16px">
                <label class="form-label">Application Deadline</label>
                <input class="form-control" type="date" formControlName="deadline" />
              </div>
            </div>

            <div class="form-section">
              <div class="form-section-title">Job Details</div>
              <div class="form-group">
                <label class="form-label">Job Description *</label>
                <textarea class="form-control" formControlName="description" rows="6"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."></textarea>
              </div>
              <div class="form-group" style="margin-top:16px">
                <label class="form-label">Required Skills</label>
                <input class="form-control" formControlName="requiredSkills"
                  placeholder="e.g. React, TypeScript, Node.js (comma separated)" />
                <div class="form-hint">Separate skills with commas for best ATS matching</div>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-ghost" (click)="back()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="loading || form.invalid">
                <span *ngIf="!loading">🚀 Publish Job</span>
                <div *ngIf="loading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 860px; margin: 0 auto; }
    .form-page {}
    .form-header { margin-bottom: 28px; }
    .form-header h2 { font-size: 2rem; margin: 6px 0 8px; }
    .sub { color: var(--text-secondary); font-size: 14px; }

    .form-body { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 36px; }
    .form-section { margin-bottom: 32px; }
    .form-section-title {
      font-family: var(--font-display); font-size: 1rem; font-weight: 700;
      color: var(--teal); margin-bottom: 20px;
      padding-bottom: 10px; border-bottom: 1px solid var(--border);
    }
    .form-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `]
})
export class JobCreateComponent {
  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    location: ['', Validators.required],
    requiredSkills: [''],
    salaryRange: [''],
    jobType: ['Full Time'],
    deadline: ['']
  });
  loading = false; success = ''; error = '';

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.api.createJob(this.form.value).subscribe({
      next: () => {
        console.log(this.form.value)
        this.success = 'Job posted successfully! Redirecting...';
        setTimeout(() => this.router.navigate(['/recruiter/dashboard']), 1500);
      },
      error: (e) => { 
        const errMsg = e.error?.message || e.error?.msg || (typeof e.error === 'string' ? e.error : 'Failed to post job');
        this.error = errMsg;
        this.loading = false; 
      }
    });
  }

  back() { this.router.navigate(['/recruiter/dashboard']); }
}
