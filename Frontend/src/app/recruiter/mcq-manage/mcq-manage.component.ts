import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-mcq-manage',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div class="fade-in">
        <button class="btn btn-ghost btn-sm" (click)="back()">← Back</button>

        <div class="page-header">
          <div>
            <div class="section-label">Round 2</div>
            <h2>MCQ Test Manager</h2>
            <p style="color:var(--text-secondary);font-size:14px;margin-top:6px">Job #{{ jobId }}</p>
          </div>
          <button class="btn btn-primary btn-lg" (click)="releaseTest()" [disabled]="releasing">
            <span *ngIf="!releasing">🚀 Release Test to Candidates</span>
            <div *ngIf="releasing" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
          </button>
        </div>

        <div class="alert alert-success" *ngIf="releaseMsg">{{ releaseMsg }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <div class="mcq-layout">
          <!-- Create Test Form -->
          <div class="card">
            <h4 style="margin-bottom:20px">Create MCQ Test</h4>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="grid-2" style="margin-bottom:16px">
                <div class="form-group">
                  <label class="form-label">Topic / Subject</label>
                  <input class="form-control" formControlName="topic" placeholder="e.g. Java, React, DSA" />
                </div>
                <div class="form-group">
                  <label class="form-label">Difficulty Level</label>
                  <select class="form-control" formControlName="difficulty">
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Number of Questions</label>
                  <input class="form-control" type="number" formControlName="questionCount" min="5" max="50" />
                </div>
                <div class="form-group">
                  <label class="form-label">Start Time</label>
                  <input class="form-control" type="datetime-local" formControlName="startTime" />
                </div>
                <div class="form-group">
                  <label class="form-label">End Time</label>
                  <input class="form-control" type="datetime-local" formControlName="endTime" />
                </div>
              </div>

              <!-- Questions -->
              <div class="questions-section">
                <div class="q-section-header">
                  <h4>Questions</h4>
                  <button type="button" class="btn btn-ghost btn-sm" (click)="addQuestion()">+ Add Question</button>
                </div>

                <div formArrayName="questions">
                  <div class="question-block" *ngFor="let q of questions.controls; let i = index" [formGroupName]="i">
                    <div class="q-header">
                      <span class="q-num">Q{{ i + 1 }}</span>
                      <button type="button" class="btn btn-ghost btn-sm" (click)="removeQuestion(i)" *ngIf="questions.length > 1">✕</button>
                    </div>
                    <div class="form-group" style="margin-bottom:12px">
                      <input class="form-control" formControlName="questionText" placeholder="Enter question..." />
                    </div>
                    <div class="options-grid">
                      <div class="form-group" *ngFor="let opt of ['optionA','optionB','optionC','optionD']; let oi = index">
                        <label class="form-label">Option {{ 'ABCD'[oi] }}</label>
                        <input class="form-control" [formControlName]="opt" placeholder="Option {{ 'ABCD'[oi] }}" />
                      </div>
                    </div>
                    <div class="form-group" style="margin-top:10px">
                      <label class="form-label">Correct Answer</label>
                      <select class="form-control" formControlName="correctOption">
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:20px">
                <button type="button" class="btn btn-primary btn-lg" (click)="submit()">
                  <span *ngIf="!saving">💾 Save MCQ Test</span>
                  <div *ngIf="saving" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                </button>
              </div>
            </form>
          </div>

          <!-- Preview Card -->
          <div class="card preview-card">
            <h4 style="margin-bottom:16px">Test Summary</h4>
            <div class="preview-stats">
              <div class="prev-stat">
                <div class="prev-val">{{ form.value.questionCount || 10 }}</div>
                <div class="prev-label">Questions</div>
              </div>
              <div class="prev-stat">
                <div class="prev-val">{{ form.value.difficulty || 'MEDIUM' }}</div>
                <div class="prev-label">Difficulty</div>
              </div>
            </div>

            <div class="divider"></div>

            <div class="info-list">
              <div class="info-row">
                <span class="info-label">Topic</span>
                <span class="info-value">{{ form.value.topic || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Questions Added</span>
                <span class="info-value" style="color:var(--teal)">{{ questions.length }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Start Time</span>
                <span class="info-value">{{ form.value.startTime || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">End Time</span>
                <span class="info-value">{{ form.value.endTime || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Job ID</span>
                <span class="info-value">#{{ jobId }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div style="background:var(--amber-glow);border:1px solid rgba(255,179,71,0.2);border-radius:var(--radius-sm);padding:12px;font-size:12px;color:var(--amber)">
              ⚠️ Once released, candidates who passed Round 1 will receive access to this MCQ test.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin: 20px 0 24px; }
    .page-header h2 { font-size: 2rem; }

    .mcq-layout { display: grid; grid-template-columns: 1fr 300px; gap: 20px; align-items: start; }

    .questions-section { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px; }
    .q-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

    .question-block {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 20px; margin-bottom: 14px;
    }
    .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .q-num {
      font-family: var(--font-display); font-size: 13px; font-weight: 700;
      color: var(--teal); background: var(--teal-glow);
      border: 1px solid rgba(0,229,195,0.2); border-radius: var(--radius-sm);
      padding: 3px 10px;
    }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

    .preview-card { padding: 24px; position: sticky; top: 90px; }
    .preview-stats { display: flex; justify-content: space-around; margin-bottom: 16px; }
    .prev-stat { text-align: center; }
    .prev-val { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--teal); }
    .prev-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    .info-list { display: flex; flex-direction: column; gap: 12px; }
    .info-row { display: flex; justify-content: space-between; }
    .info-label { font-size: 12px; color: var(--text-muted); }
    .info-value { font-size: 13px; font-weight: 500; }

    @media(max-width:900px) { .mcq-layout { grid-template-columns: 1fr; } }
  `]
})
export class McqManageComponent implements OnInit {
  jobId!: number;
  saving = false; releasing = false;
  releaseMsg = ''; error = '';

    calculateDuration(start: string, end: string): number {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.floor((e - s) / (1000 * 60));
  }

  form = this.fb.group({
    topic: ['', Validators.required],
    difficulty: ['MEDIUM'],
    questionCount: [10],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    questions: this.fb.array([this.newQuestion()])
  });

  get questions() { return this.form.get('questions') as FormArray; }

  newQuestion() {
    return this.fb.group({
      questionText: ['', Validators.required],
      optionA: [''], optionB: [''], optionC: [''], optionD: [''],
      correctOption: ['A']
    });
  }

  constructor(private route: ActivatedRoute, private api: ApiService, private fb: FormBuilder, private router: Router) {}

  ngOnInit() { this.jobId = Number(this.route.snapshot.paramMap.get('jobId')); }

  addQuestion() { this.questions.push(this.newQuestion()); }
  removeQuestion(i: number) { this.questions.removeAt(i); }
  

  submit() {
    this.saving = true;
    this.error = '';

    const formData = this.form.value;

    const testPayload = {
      jobId: this.jobId,
      durationMinutes: this.calculateDuration(
        formData.startTime,
        formData.endTime
      ),
      totalMarks: formData.questionCount * 1,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString()
    };

    // STEP 1: Create Test
    this.api.createMcqTest(testPayload).subscribe({
      next: (res: any) => {
        const testId = res?.id;

        // STEP 2: Map and Save Manual Questions
        const manualQuestions = formData.questions.map((q: any) => ({
          testId: testId,
          question: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctOption: q.correctOption
        }));

        // Filter out empty questions if any
        const validManualQuestions = manualQuestions.filter((q: any) => q.question && q.question.trim() !== '');

        if (validManualQuestions.length > 0) {
          this.api.saveMcqQuestionsBatch(validManualQuestions).subscribe({
            next: () => {
              this.releaseMsg = 'MCQs generated';
              this.saving = false;
              setTimeout(() => this.releaseMsg = '', 3000);
            },
            error: (e) => {
              this.error = 'Test saved but failed to save questions';
              this.saving = false;
            }
          });
        } else {
          // STEP 3: Fallback to AI GENERATION if no manual questions
          const aiPayload = {
            testId: testId,
            topic: formData.topic,
            difficulty: formData.difficulty,
            count: formData.questionCount
          };

          this.api.generateAiQuestions(aiPayload).subscribe({
            next: () => {
              this.releaseMsg = 'MCQs generated';
              this.saving = false;
              setTimeout(() => this.releaseMsg = '', 3000);
            },
            error: (e) => {
              this.releaseMsg = 'Test saved but AI generation failed.';
              this.saving = false;
            }
          });
        }
      },
      error: (e) => {
        this.error = e.error?.message || 'Failed to create test';
        this.saving = false;
      }
    });
  }

  releaseTest() {
    this.releasing = true; this.error = '';
    this.api.releaseMcqTest(this.jobId).subscribe({
      next: () => { this.releaseMsg = 'MCQ test released to qualified candidates!'; this.releasing = false; },
      error: (e) => { 
        const errMsg = e.error?.message || e.error?.msg || (typeof e.error === 'string' ? e.error : 'Failed to release test');
        this.error = errMsg;
        this.releasing = false; 
      }
    });
  }

  back() { this.router.navigate(['/recruiter/applicants', this.jobId]); }
}
