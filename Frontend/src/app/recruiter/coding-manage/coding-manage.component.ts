import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-coding-manage',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div class="fade-in">
        <button class="btn btn-ghost btn-sm" (click)="back()">← Back</button>

        <div class="page-header">
          <div>
            <div class="section-label">Round 3</div>
            <h2>Technical Coding Assessment Manager</h2>
            <p style="color:var(--text-secondary);font-size:14px;margin-top:6px">Job #{{ jobId }}</p>
          </div>
          <div style="display:flex;gap:12px">
            <button class="btn btn-outline" (click)="activeTab = 'submissions'" [ngClass]="{'btn-active': activeTab === 'submissions'}">
              📊 Candidate Submissions ({{ submissions.length }})
            </button>
            <button class="btn btn-primary" (click)="activeTab = 'create'" [ngClass]="{'btn-active': activeTab === 'create'}">
              ➕ Create / Edit Coding Problem
            </button>
          </div>
        </div>

        <div class="alert alert-success" *ngIf="successMsg">{{ successMsg }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <!-- TAB 1: CREATE PROBLEM FORM -->
        <div *ngIf="activeTab === 'create'" class="coding-create-layout">
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
              <h4 style="margin:0">Create Coding Challenge</h4>
              <span class="badge" style="background:#0284c7;color:#fff">LeetCode Engine</span>
            </div>

            <form [formGroup]="form" (ngSubmit)="saveProblem()">
              <div class="grid-2" style="margin-bottom:16px">
                <div class="form-group">
                  <label class="form-label">Problem Title *</label>
                  <input class="form-control" formControlName="title" placeholder="e.g. Two Sum, Reverse Linked List" />
                </div>
                <div class="form-group">
                  <label class="form-label">Difficulty *</label>
                  <select class="form-control" formControlName="difficulty">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Time Limit (ms)</label>
                  <input class="form-control" type="number" formControlName="timeLimitMs" placeholder="2000" />
                </div>
                <div class="form-group">
                  <label class="form-label">Memory Limit (MB)</label>
                  <input class="form-control" type="number" formControlName="memoryLimitMb" placeholder="256" />
                </div>
              </div>

              <div class="form-group" style="margin-bottom:16px">
                <label class="form-label">Problem Statement & Description *</label>
                <textarea class="form-control" rows="5" formControlName="description" 
                  placeholder="Describe the problem, input format, output format, and constraints..."></textarea>
              </div>

              <!-- STARTER CODE TEMPLATES ACCORDION -->
              <div class="code-templates-section">
                <h4 style="margin-bottom:12px;font-size:15px;color:var(--text-primary)">Starter Code Boilerplates</h4>
                <div class="grid-2" style="gap:16px">
                  <div class="form-group">
                    <label class="form-label">☕ Java Starter Code</label>
                    <textarea class="form-control code-editor-box" rows="5" formControlName="javaTemplate"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">🐍 Python Starter Code</label>
                    <textarea class="form-control code-editor-box" rows="5" formControlName="pythonTemplate"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">⚡ C++ Starter Code</label>
                    <textarea class="form-control code-editor-box" rows="5" formControlName="cppTemplate"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">🟨 JavaScript Starter Code</label>
                    <textarea class="form-control code-editor-box" rows="5" formControlName="jsTemplate"></textarea>
                  </div>
                </div>
              </div>

              <!-- TEST CASES BUILDER -->
              <div class="testcases-builder-section" style="margin-top:24px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                  <div>
                    <h4 style="margin:0;font-size:16px">Evaluation Test Cases</h4>
                    <p style="color:var(--text-secondary);font-size:13px;margin-top:4px">
                      Add sample test cases (visible to candidate) and secret hidden test cases (for final evaluation).
                    </p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" (click)="addTestCase()">+ Add Test Case</button>
                </div>

                <div formArrayName="testCases">
                  <div class="tc-card" *ngFor="let tc of testCases.controls; let i = index" [formGroupName]="i">
                    <div class="tc-card-header">
                      <span class="tc-title">Test Case #{{ i + 1 }}</span>
                      <div style="display:flex;align-items:center;gap:12px">
                        <label style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;cursor:pointer">
                          <input type="checkbox" formControlName="isHidden" />
                          <span>🔒 Hidden Testcase</span>
                        </label>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="removeTestCase(i)" *ngIf="testCases.length > 1">✕</button>
                      </div>
                    </div>

                    <div class="grid-2" style="margin-top:10px">
                      <div class="form-group">
                        <label class="form-label">Input Data</label>
                        <textarea class="form-control code-editor-box" rows="2" formControlName="inputData" placeholder="e.g. 5 10"></textarea>
                      </div>
                      <div class="form-group">
                        <label class="form-label">Expected Output *</label>
                        <textarea class="form-control code-editor-box" rows="2" formControlName="expectedOutput" placeholder="e.g. 15"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px">
                <button type="submit" class="btn btn-primary btn-lg" [disabled]="saving || form.invalid">
                  <span *ngIf="!saving">💾 Save & Publish Coding Problem</span>
                  <div *ngIf="saving" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- TAB 2: CANDIDATE SUBMISSIONS & CODE REVIEW -->
        <div *ngIf="activeTab === 'submissions'" class="card">
          <h4 style="margin-bottom:16px">Candidate Coding Submissions</h4>
          
          <div *ngIf="loadingSubmissions" style="text-align:center;padding:30px">
            <div class="spinner"></div>
            <p style="color:var(--text-secondary);margin-top:10px">Loading candidate submissions...</p>
          </div>

          <div *ngIf="!loadingSubmissions && submissions.length === 0" style="text-align:center;padding:40px;color:var(--text-muted)">
            <p style="font-size:16px">No candidates have submitted this coding assessment yet.</p>
          </div>

          <div class="table-wrap" *ngIf="!loadingSubmissions && submissions.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Language</th>
                  <th>Passed Cases</th>
                  <th>Verdict</th>
                  <th>Exec Time</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sub of submissions">
                  <td>
                    <div style="font-weight:600">{{ sub.applicant_name }}</div>
                    <div style="font-size:12px;color:var(--text-muted)">{{ sub.applicant_email }}</div>
                  </td>
                  <td><span class="lang-tag">{{ sub.language }}</span></td>
                  <td><strong>{{ sub.passed_test_cases }} / {{ sub.total_test_cases }}</strong></td>
                  <td>
                    <span class="badge" [ngClass]="sub.status === 'ACCEPTED' ? 'badge-success' : 'badge-danger'">
                      {{ sub.status }}
                    </span>
                  </td>
                  <td style="color:var(--text-secondary);font-size:13px">{{ sub.execution_time_ms }} ms</td>
                  <td style="color:var(--text-muted);font-size:12px">{{ sub.submitted_at }}</td>
                  <td>
                    <button class="btn btn-outline btn-sm" (click)="viewCode(sub)">👁 View Code</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- CODE VIEW MODAL -->
        <div class="modal-overlay" *ngIf="selectedSubmission" (click)="selectedSubmission = null">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 style="margin:0">{{ selectedSubmission.applicant_name }}'s Code</h3>
                <p style="color:var(--text-muted);font-size:12px;margin-top:4px">
                  Language: {{ selectedSubmission.language }} | Verdict: {{ selectedSubmission.status }}
                </p>
              </div>
              <button class="btn btn-ghost btn-sm" (click)="selectedSubmission = null">✕</button>
            </div>
            <pre class="code-viewer">{{ selectedSubmission.code }}</pre>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
    .section-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #0284c7; letter-spacing: 1px; }
    .btn-active { background: #0284c7 !important; color: white !important; }
    .code-editor-box { font-family: monospace; font-size: 13px; background: #0f172a; color: #38bdf8; resize: vertical; }
    .tc-card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 14px; }
    .tc-card-header { display: flex; justify-content: space-between; align-items: center; }
    .tc-title { font-weight: 600; font-size: 13px; color: #f8fafc; }
    .lang-tag { background: #1e293b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 999; }
    .modal-card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; width: 90%; max-width: 700px; padding: 24px; max-height: 80vh; display: flex; flex-direction: column; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #334155; padding-bottom: 12px; }
    .code-viewer { background: #070d19; color: #e2e8f0; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow: auto; flex: 1; margin: 0; }
  `]
})
export class CodingManageComponent implements OnInit {
  jobId: number = 0;
  activeTab: 'create' | 'submissions' = 'create';
  form!: FormGroup;
  saving: boolean = false;
  successMsg: string = '';
  error: string = '';
  
  submissions: any[] = [];
  loadingSubmissions: boolean = false;
  selectedSubmission: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.jobId = Number(this.route.snapshot.paramMap.get('jobId'));
    this.initForm();
    this.loadExistingProblem();
    this.loadSubmissions();
  }

  initForm() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      difficulty: ['MEDIUM', Validators.required],
      timeLimitMs: [2000],
      memoryLimitMb: [256],
      description: ['', Validators.required],
      javaTemplate: [`import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and print result\n    }\n}`],
      pythonTemplate: [`import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    # Read input and print result\n\nif __name__ == '__main__':\n    solve()`],
      cppTemplate: [`#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input and print result\n    return 0;\n}`],
      jsTemplate: [`const fs = require('fs');\n\nfunction solve() {\n    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\n    // Read input and print result\n}\nsolve();`],
      testCases: this.fb.array([
        this.createTestCaseGroup('5 10', '15', false),
        this.createTestCaseGroup('100 200', '300', true)
      ])
    });
  }

  get testCases(): FormArray {
    return this.form.get('testCases') as FormArray;
  }

  createTestCaseGroup(input: string = '', output: string = '', isHidden: boolean = false): FormGroup {
    return this.fb.group({
      inputData: [input],
      expectedOutput: [output, Validators.required],
      isHidden: [isHidden]
    });
  }

  addTestCase() {
    this.testCases.push(this.createTestCaseGroup('', '', true));
  }

  removeTestCase(index: number) {
    this.testCases.removeAt(index);
  }

  loadExistingProblem() {
    this.api.getCodingProblemsByJob(this.jobId).subscribe({
      next: (problems: any[]) => {
        if (problems && problems.length > 0) {
          const p = problems[0];
          this.form.patchValue({
            title: p.title,
            difficulty: p.difficulty,
            timeLimitMs: p.timeLimitMs || 2000,
            memoryLimitMb: p.memoryLimitMb || 256,
            description: p.description,
            javaTemplate: p.javaTemplate,
            pythonTemplate: p.pythonTemplate,
            cppTemplate: p.cppTemplate,
            jsTemplate: p.jsTemplate
          });
        }
      },
      error: (err) => console.log('No existing coding problem found:', err)
    });
  }

  loadSubmissions() {
    this.loadingSubmissions = true;
    this.api.getJobCodingSubmissions(this.jobId).subscribe({
      next: (subs: any[]) => {
        this.submissions = subs || [];
        this.loadingSubmissions = false;
      },
      error: (err) => {
        this.loadingSubmissions = false;
      }
    });
  }

  saveProblem() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    this.successMsg = '';

    const val = this.form.value;
    const problemPayload = {
      jobId: this.jobId,
      title: val.title,
      difficulty: val.difficulty,
      description: val.description,
      timeLimitMs: val.timeLimitMs,
      memoryLimitMb: val.memoryLimitMb,
      javaTemplate: val.javaTemplate,
      pythonTemplate: val.pythonTemplate,
      cppTemplate: val.cppTemplate,
      jsTemplate: val.jsTemplate,
      sampleTestCases: val.testCases
    };

    this.api.createCodingProblem(problemPayload).subscribe({
      next: (res) => {
        this.saving = false;
        this.successMsg = 'Coding problem published successfully! Shortlisted candidates can now take this assessment.';
        setTimeout(() => this.successMsg = '', 5000);
      },
      error: (err) => {
        this.saving = false;
        this.error = 'Failed to publish coding problem: ' + (err.error?.message || err.message);
      }
    });
  }

  viewCode(sub: any) {
    this.selectedSubmission = sub;
  }

  back() {
    this.router.navigate(['/recruiter/dashboard']);
  }
}
