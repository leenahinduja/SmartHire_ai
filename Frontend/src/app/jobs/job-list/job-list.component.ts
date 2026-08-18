import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-job-list',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">

      <!-- Page Header -->
      <div class="page-header fade-in">
        <div>
          <div class="section-label">Opportunities</div>
          <h2>Browse Jobs</h2>
        </div>
        <div class="results-count" *ngIf="!loading">
          <span class="count">{{ jobs.length }}</span> positions found
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar fade-in">
        <div class="search-field">
          <span class="search-icon">🔍</span>
          <input class="search-input" type="text" placeholder="Job title, skills, keyword..."
            [formControl]="keywordCtrl" />
        </div>
        <div class="search-field">
          <span class="search-icon">📍</span>
          <input class="search-input" type="text" placeholder="Location..."
            [formControl]="locationCtrl" />
        </div>
        <button class="btn btn-primary" (click)="search()">Search</button>
        <button class="btn btn-ghost" (click)="reset()">Clear</button>
      </div>

      <!-- Filters -->
      <div class="filter-row fade-in">
        <button class="filter-btn" [class.active]="activeFilter === 'all'" (click)="filterBy('all')">All Jobs</button>
        <button class="filter-btn" [class.active]="activeFilter === 'Full Time'" (click)="filterBy('Full Time')">Full Time</button>
        <button class="filter-btn" [class.active]="activeFilter === 'Part Time'" (click)="filterBy('Part Time')">Part Time</button>
        <button class="filter-btn" [class.active]="activeFilter === 'Remote'" (click)="filterBy('Remote')">Remote</button>
        <button class="filter-btn" [class.active]="activeFilter === 'Internship'" (click)="filterBy('Internship')">Internship</button>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" style="padding:80px;text-align:center"><div class="spinner"></div></div>

      <!-- Empty -->
      <div *ngIf="!loading && filteredJobs.length === 0" class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No jobs found</h3>
        <p>Try different search terms or clear filters</p>
      </div>

      <!-- Job Grid -->
      <div class="jobs-grid" *ngIf="!loading">
        <div class="job-card card fade-in" *ngFor="let job of filteredJobs" (click)="goToJob(job.id)">
          <div class="job-header">
            <div class="company-logo">{{ job.title?.charAt(0) }}</div>
            <div class="job-meta">
              <h4>{{ job.title }}</h4>
              <div class="meta-row">
                <span>📍 {{ job.location }}</span>
                <span class="badge badge-teal">{{ job.jobType || 'Full Time' }}</span>
              </div>
            </div>
          </div>

          <p class="job-desc">{{ job.description | slice:0:120 }}...</p>

          <div class="skill-tags tags">
            <span class="tag" *ngFor="let s of getSkills(job.requiredSkills)">{{ s }}</span>
          </div>

          <div class="job-footer">
            <div class="salary">💰 {{ job.salaryRange || 'Competitive' }}</div>
            <div class="deadline" *ngIf="job.deadline">
              <span>⏰ Deadline: {{ formatDate(job.deadline) }}</span>
            </div>
          </div>

          <div class="apply-hint">Click to view & apply →</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .page-header h2 { font-size: 2rem; margin-top: 6px; }
    .results-count { font-size: 13px; color: var(--text-muted); }
    .results-count .count { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--teal); }

    .search-bar {
      display: flex; gap: 12px; align-items: center;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 16px 20px;
      margin-bottom: 20px;
    }
    .search-field {
      display: flex; align-items: center; gap: 10px;
      flex: 1; background: var(--bg-elevated);
      border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 8px 14px;
    }
    .search-icon { font-size: 16px; }
    .search-input {
      background: none; border: none; outline: none;
      color: var(--text-primary); font-family: var(--font-body); font-size: 14px; width: 100%;
    }
    .search-input::placeholder { color: var(--text-muted); }

    .filter-row { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .filter-btn {
      padding: 7px 18px; border-radius: 100px;
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-secondary); font-size: 13px; font-weight: 500;
      cursor: pointer; transition: var(--transition);
    }
    .filter-btn:hover { border-color: var(--border-light); color: var(--text-primary); }
    .filter-btn.active { background: var(--teal-glow); border-color: var(--teal); color: var(--teal); }

    .jobs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
    .job-card { cursor: pointer; padding: 24px; transition: var(--transition); }
    .job-card:hover { border-color: rgba(0,229,195,0.3); transform: translateY(-3px); box-shadow: var(--shadow-glow); }

    .job-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
    .company-logo {
      width: 44px; height: 44px; border-radius: var(--radius-sm);
      background: linear-gradient(135deg, var(--teal-glow), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.2);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--teal);
      flex-shrink: 0;
    }
    .job-meta { flex: 1; }
    .job-meta h4 { font-size: 1rem; margin-bottom: 6px; }
    .meta-row { display: flex; gap: 10px; align-items: center; font-size: 12px; color: var(--text-secondary); }

    .job-desc { font-size: 13px; color: var(--text-muted); line-height: 1.6; margin-bottom: 14px; }
    .skill-tags { margin-bottom: 16px; }

    .job-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .salary { font-size: 13px; color: var(--teal); font-weight: 500; }
    .deadline { font-size: 12px; color: var(--text-muted); }

    .apply-hint {
      font-size: 12px; color: var(--teal); font-weight: 500;
      opacity: 0; transition: var(--transition); margin-top: 8px;
    }
    .job-card:hover .apply-hint { opacity: 1; }
  `]
})
export class JobListComponent implements OnInit {
  jobs: any[] = [];
  filteredJobs: any[] = [];
  loading = true;
  activeFilter = 'all';

  keywordCtrl = this.fb.control('');
  locationCtrl = this.fb.control('');

  constructor(private api: ApiService, private router: Router, private fb: FormBuilder) {}

  ngOnInit() {
    this.api.getAllJobs().subscribe({
      next: (data) => { this.jobs = data || []; this.filteredJobs = [...this.jobs]; this.loading = false; },
      error: () => this.loading = false
    });
  }

  search() {
    const kw = this.keywordCtrl.value || '';
    const loc = this.locationCtrl.value || '';
    if (kw || loc) {
      this.api.searchJobs(kw, loc).subscribe({
        next: (data) => { this.jobs = data || []; this.applyFilter(); }
      });
    } else {
      this.api.getAllJobs().subscribe({ next: (d) => { this.jobs = d || []; this.applyFilter(); } });
    }
  }

  reset() {
    this.keywordCtrl.setValue(''); this.locationCtrl.setValue('');
    this.activeFilter = 'all';
    this.api.getAllJobs().subscribe({ next: (d) => { this.jobs = d || []; this.filteredJobs = [...this.jobs]; } });
  }

  filterBy(type: string) {
    this.activeFilter = type;
    this.applyFilter();
  }

  applyFilter() {
    if (this.activeFilter === 'all') { this.filteredJobs = [...this.jobs]; }
    else { this.filteredJobs = this.jobs.filter(j => j.jobType === this.activeFilter); }
  }

  goToJob(id: number) { this.router.navigate(['/jobs', id]); }

  getSkills(skills: string): string[] {
    return (skills || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
