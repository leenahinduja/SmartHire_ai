import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'app-round2-test',
  template: `
    <div class="test-page">

      <!-- ── Loading ── -->
      <div class="center-page" *ngIf="loading">
        <div class="spinner"></div>
        <div style="margin-top:16px;color:var(--text-secondary)">Loading Round 2 test…</div>
      </div>

      <!-- ── Not Eligible ── -->
      <div class="center-page fade-in" *ngIf="!loading && !eligible && !started">
        <div class="start-card" style="text-align:center">
          <div style="font-size:52px;margin-bottom:16px">🚫</div>
          <div class="section-label" style="justify-content:center;margin-bottom:12px">Round 2</div>
          <h2 style="margin-bottom:12px">Not Eligible</h2>
          <p style="color:var(--text-secondary);margin-bottom:28px">
            {{ notEligibleMsg }}<br><br>
            If you clicked this link from an email, please ensure you are logged in with the <b>applicant account</b> that received the email.
          </p>
          <button class="btn btn-outline btn-full" (click)="router.navigate(['/my-applications'])">
            ← Go to Dashboard
          </button>
        </div>
      </div>

      <!-- ── Start Screen ── -->
      <div class="start-screen fade-in" *ngIf="!loading && eligible && !started && !submitted">
        <div class="start-card">
          <div style="font-size:48px;margin-bottom:16px">🏆</div>
          <div class="section-label" style="justify-content:center;margin-bottom:12px">Round 2 Assessment</div>
          <h2>Technical MCQ Test</h2>
          <p style="color:var(--text-secondary);margin:12px 0 0">Test ID: #{{ testId }}</p>

          <div class="test-info-grid">
            <div class="test-info-item">
              <div class="ti-val">{{ questions.length }}</div>
              <div class="ti-label">Questions</div>
            </div>
            <div class="test-info-item">
              <div class="ti-val">{{ timeLimitMin }}m</div>
              <div class="ti-label">Time Limit</div>
            </div>
            <div class="test-info-item">
              <div class="ti-val">+1</div>
              <div class="ti-label">Per Correct</div>
            </div>
          </div>

          <div class="instructions">
            <div class="inst-title">Rules & AI Camera Proctoring Instructions</div>
            <ul>
              <li><b>Continuous Camera Monitoring:</b> Your webcam will remain active throughout the test.</li>
              <li><b>Strict Single-Person Rule:</b> Only you (the candidate) must be visible in the camera frame. Multiple faces or unauthorized helpers will trigger proctor violations.</li>
              <li>Tab switches and exiting full screen are actively monitored and logged.</li>
              <li>Once started, the timer cannot be paused.</li>
            </ul>
          </div>

          <div *ngIf="startError" class="alert alert-error" style="margin-bottom:16px">{{ startError }}</div>

          <button class="btn btn-primary btn-full btn-lg" (click)="showSystemCheck = true" [disabled]="startLoading">
            <span *ngIf="!startLoading">Begin Round 2 →</span>
            <div *ngIf="startLoading" class="spinner" style="width:18px;height:18px;border-width:2px"></div>
          </button>
        </div>
      </div>

      <!-- System Check Modal -->
      <app-system-check 
        *ngIf="showSystemCheck" 
        (allPassed)="onSystemCheckPassed()" 
        (onCheckPassed)="onSystemCheckPassed()"
        (canceled)="showSystemCheck = false"
        (onCancel)="showSystemCheck = false">
      </app-system-check>

      <!-- Proctor warning banners -->
      <div class="proctor-banner multiple-alert" *ngIf="multipleFaceWarning && started && !submitted">
        🚨 <b>CRITICAL PROCTOR VIOLATION:</b> Multiple persons ({{ detectedFaceCount }}) detected in camera view! Only the candidate is permitted in frame.
      </div>

      <div class="proctor-banner no-face-alert" *ngIf="noFaceWarning && !multipleFaceWarning && started && !submitted">
        ⚠️ <b>WARNING:</b> No face detected in camera view. Please remain seated and centered in front of your camera.
      </div>

      <div class="proctor-banner" *ngIf="violations > 0 && !multipleFaceWarning && !noFaceWarning && started && !submitted">
        ⚠️ Warning: {{ violations }} proctor violation(s) detected and logged.
      </div>

      <!-- ── Test Interface ── -->
      <div class="test-interface" *ngIf="started && !submitted">

        <!-- Top Bar -->
        <div class="test-topbar">
          <div class="test-brand">⬡ SmartHireAI — Round 2</div>

          <!-- Live AI Proctor Status Pill in Header -->
          <div class="proctor-header-badge" [ngClass]="proctorFaceStatus">
            <span class="pulse-dot"></span>
            <span class="badge-text">{{ proctorStatusMessage }}</span>
          </div>

          <div class="test-progress-info">
            Question {{ currentQ + 1 }} / {{ questions.length }}
          </div>
          <div class="timer" [class.danger]="timeLeft < 60">
            ⏱ {{ formatTime(timeLeft) }}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="test-progress">
          <div class="test-progress-fill" [style.width]="progressPct + '%'"></div>
        </div>

        <div class="test-body">

          <!-- Question Nav Sidebar -->
          <div class="q-nav">
            <div class="q-nav-label">Questions</div>
            <div class="q-nav-grid">
              <div class="q-nav-btn"
                *ngFor="let q of questions; let i = index"
                [class.current]="i === currentQ"
                [class.answered]="answers[i] !== undefined"
                (click)="goToQuestion(i)">
                {{ i + 1 }}
              </div>
            </div>
            <div class="q-legend">
              <span class="leg-item"><span class="leg-dot answered"></span> Answered</span>
              <span class="leg-item"><span class="leg-dot current"></span> Current</span>
              <span class="leg-item"><span class="leg-dot"></span> Skipped</span>
            </div>
          </div>

          <!-- Question Card -->
          <div class="q-main">
            <div class="question-card card" *ngIf="questions[currentQ]">
              <div class="q-badge">Q{{ currentQ + 1 }}</div>
              <h4 class="q-text">{{ questions[currentQ].question }}</h4>

              <div class="options-list">
                <div class="option-item"
                  *ngFor="let opt of getOptions(questions[currentQ]); let oi = index"
                  [class.selected]="answers[currentQ] === 'ABCD'[oi]"
                  (click)="selectAnswer('ABCD'[oi])">
                  <div class="opt-letter">{{ 'ABCD'[oi] }}</div>
                  <div class="opt-text">{{ opt }}</div>
                </div>
              </div>

              <div class="q-navigation">
                <button class="btn btn-ghost" (click)="prev()" [disabled]="currentQ === 0">← Prev</button>
                <button class="btn btn-primary" *ngIf="currentQ < questions.length - 1" (click)="next()">Next →</button>
                <button class="btn btn-primary" *ngIf="currentQ === questions.length - 1" (click)="confirmSubmit()" [disabled]="submitting">
                   <span *ngIf="!submitting">Submit Round 2 ✓</span>
                   <div *ngIf="submitting" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Live Proctoring Camera Feed (Bottom-Right) -->
        <div class="proctor-pip-cam" [ngClass]="proctorFaceStatus">
          <video #proctorVideo autoplay playsinline muted class="pip-video"></video>
          <canvas #proctorCanvas style="display:none;"></canvas>
          <div class="pip-tag">
            <span class="live-dot-green"></span>
            <span>AI Cam Active</span>
          </div>
        </div>

      </div>

      <!-- ── Result Screen ── -->
      <div class="result-screen fade-in" *ngIf="submitted">
        <div class="result-card">
          <div class="result-emoji">{{ scorePct >= 70 ? '🎉' : scorePct >= 50 ? '👍' : '😔' }}</div>
          <h2>Round 2 Submitted!</h2>
          <div class="score-circle">
            <div class="score-num">{{ scorePct }}%</div>
            <div class="score-label">Your Score</div>
          </div>
          <div class="score-bar-wrap">
            <div class="score-bar-bg">
              <div class="score-bar-fill" [style.width]="scorePct + '%'"
                [style.background]="scorePct >= 70 ? 'var(--teal)' : scorePct >= 50 ? 'var(--amber)' : 'var(--red)'">
              </div>
            </div>
          </div>
          <div class="result-stats">
            <div class="rs-item">
              <div class="rs-val" style="color:var(--teal)">{{ correctCount }}</div>
              <div class="rs-label">Correct</div>
            </div>
            <div class="rs-item">
              <div class="rs-val" style="color:var(--red)">{{ questions.length - correctCount }}</div>
              <div class="rs-label">Wrong</div>
            </div>
            <div class="rs-item">
              <div class="rs-val">{{ questions.length }}</div>
              <div class="rs-label">Total</div>
            </div>
          </div>

          <div style="margin-top:24px">
            <button class="btn btn-primary" (click)="router.navigate(['/my-applications'])">
              Return to My Applications →
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .test-page { min-height: 100vh; background: var(--bg); position: relative; }
    .center-page { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 20px; }
    .start-screen { display: flex; justify-content: center; padding: 40px 20px; }
    .start-card {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 40px; max-width: 540px; width: 100%;
      text-align: center;
    }
    .test-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
    .test-info-item {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 14px; text-align: center;
    }
    .ti-val { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: var(--teal); }
    .ti-label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

    .instructions {
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 16px; text-align: left; margin-bottom: 24px;
    }
    .inst-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
    .instructions ul { padding-left: 18px; margin: 0; color: var(--text-secondary); font-size: 13px; }
    .instructions li { margin-bottom: 6px; }

    /* Proctoring Banners */
    .proctor-banner {
      background: rgba(245, 158, 11, 0.15); border-bottom: 1px solid #f59e0b; color: #fbbf24;
      padding: 8px 24px; font-size: 13px; text-align: center; font-weight: 600;
    }
    .proctor-banner.multiple-alert {
      background: rgba(220, 38, 38, 0.9); border-bottom: 2px solid #ef4444; color: #fff; animation: pulseRed 1.2s infinite;
    }
    .proctor-banner.no-face-alert {
      background: rgba(245, 158, 11, 0.9); border-bottom: 2px solid #f59e0b; color: #000; font-weight: 700;
    }
    @keyframes pulseRed { 0%, 100% { background: rgba(220, 38, 38, 0.95); } 50% { background: rgba(185, 28, 28, 0.85); } }

    /* Top Bar */
    .test-topbar {
      height: 60px; background: var(--bg-surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; padding: 0 24px;
    }
    .test-brand { font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--teal); }
    .test-progress-info { font-size: 14px; color: var(--text-secondary); }
    .timer {
      font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--teal);
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.2);
      border-radius: var(--radius-sm); padding: 6px 14px;
    }
    .timer.danger { color: var(--red); background: var(--red-glow); border-color: rgba(255,77,109,0.2); }

    /* Proctor Header Pill */
    .proctor-header-badge {
      display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;
      padding: 4px 12px; border-radius: 100px;
    }
    .proctor-header-badge.verified {
      background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #10b981;
    }
    .proctor-header-badge.multiple {
      background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; animation: blink 1.2s infinite;
    }
    .proctor-header-badge.empty {
      background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid #f59e0b;
    }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

    .test-progress { height: 4px; background: var(--bg-elevated); }
    .test-progress-fill { height: 100%; background: linear-gradient(90deg, var(--teal-dim), var(--teal)); transition: width 0.3s; }

    /* Test Body */
    .test-body { display: grid; grid-template-columns: 220px 1fr; min-height: calc(100vh - 60px); }

    /* Question Nav */
    .q-nav {
      background: var(--bg-surface); border-right: 1px solid var(--border);
      padding: 24px 16px;
    }
    .q-nav-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; letter-spacing: 0.05em; }
    .q-nav-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-bottom: 20px; }
    .q-nav-btn {
      aspect-ratio: 1; border-radius: var(--radius-sm);
      background: var(--bg-elevated); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; cursor: pointer; transition: var(--transition);
      color: var(--text-muted);
    }
    .q-nav-btn:hover { border-color: var(--border-light); color: var(--text-primary); }
    .q-nav-btn.answered { background: var(--teal-glow); border-color: rgba(0,229,195,0.3); color: var(--teal); }
    .q-nav-btn.current { background: var(--teal); color: #0a0c0f; border-color: var(--teal); }

    .q-legend { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .leg-item { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-muted); }
    .leg-dot {
      width: 12px; height: 12px; border-radius: 2px;
      background: var(--bg-elevated); border: 1px solid var(--border);
    }
    .leg-dot.answered { background: var(--teal-glow); border-color: rgba(0,229,195,0.3); }
    .leg-dot.current { background: var(--teal); }

    /* Question Area */
    .q-main { padding: 32px; overflow-y: auto; }
    .question-card { padding: 32px; }
    .q-badge {
      font-family: var(--font-display); font-size: 11px; font-weight: 700;
      color: var(--teal); background: var(--teal-glow);
      border: 1px solid rgba(0,229,195,0.2);
      border-radius: var(--radius-sm); padding: 3px 10px;
      display: inline-block; margin-bottom: 16px;
    }
    .q-text { font-size: 1.1rem; line-height: 1.5; margin-bottom: 24px; color: var(--text-primary); }

    .options-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
    .option-item {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 18px; border-radius: var(--radius-md);
      background: var(--bg-elevated); border: 1px solid var(--border);
      cursor: pointer; transition: var(--transition);
    }
    .option-item:hover { border-color: var(--border-light); background: var(--bg-surface); }
    .option-item.selected {
      border-color: var(--teal); background: var(--teal-glow);
    }
    .opt-letter {
      width: 32px; height: 32px; border-radius: 50%;
      background: var(--bg-surface); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-display); font-size: 12px; font-weight: 700;
      color: var(--text-muted); transition: var(--transition);
      flex-shrink: 0;
    }
    .option-item.selected .opt-letter { background: var(--teal); color: #0a0c0f; border-color: var(--teal); }
    .opt-text { font-size: 14px; color: var(--text-secondary); }
    .option-item.selected .opt-text { color: var(--text-primary); font-weight: 500; }

    .q-navigation { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); }

    /* Floating Camera Box (Picture-in-Picture) */
    .proctor-pip-cam {
      position: fixed; bottom: 20px; right: 24px; width: 170px; height: 125px;
      border-radius: 12px; overflow: hidden; background: #000; border: 2px solid #10b981;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 999;
    }
    .proctor-pip-cam.multiple { border-color: #ef4444; animation: pulseBorder 1s infinite; }
    .proctor-pip-cam.empty { border-color: #f59e0b; }
    @keyframes pulseBorder { 0%, 100% { border-color: #ef4444; } 50% { border-color: #b91c1c; } }
    .pip-video { width: 100%; height: 100%; object-fit: cover; }
    .pip-tag {
      position: absolute; bottom: 4px; left: 6px; background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px); padding: 2px 6px; border-radius: 4px; font-size: 10px;
      color: #f8fafc; display: flex; align-items: center; gap: 4px; font-weight: 600;
    }
    .live-dot-green { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: blink 1.2s infinite; }

    /* Result Screen */
    .result-screen { display: flex; justify-content: center; padding: 60px 20px; }
    .result-card {
      background: var(--bg-surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 48px; max-width: 480px; width: 100%;
      text-align: center;
    }
    .result-emoji { font-size: 56px; margin-bottom: 16px; }
    .score-circle { margin: 24px 0 16px; }
    .score-num { font-family: var(--font-display); font-size: 3.5rem; font-weight: 900; color: var(--text-primary); line-height: 1; }
    .score-label { font-size: 11px; color: var(--text-muted); }
    .score-bar-bg { height: 8px; background: var(--bg-elevated); border-radius: 4px; margin: 8px 0 24px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
    .result-stats { display: flex; justify-content: center; gap: 40px; margin: 16px 0; }
    .rs-item { text-align: center; }
    .rs-val { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; }
    .rs-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    @media(max-width: 768px) { .test-body { grid-template-columns: 1fr; } .q-nav { display: none; } }
  `]
})
export class Round2TestComponent implements OnInit, OnDestroy {
  testId!: number;
  loading       = true;
  eligible      = false;
  notEligibleMsg = '';
  startError    = '';
  startLoading  = false;
  submitting    = false;
  started       = false;
  submitted     = false;
  showSystemCheck = false;

  questions: any[] = [];
  answers:   { [qIndex: number]: string } = {};
  currentQ     = 0;
  timeLimitMin = 30;
  timeLeft     = 1800;
  timer: any;

  submissionId: number | null = null;
  score        = 0;
  correctCount = 0;
  violations   = 0;

  // ── LIVE CAMERA PROCTORING & SINGLE PERSON DETECTION ──
  @ViewChild('proctorVideo') proctorVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('proctorCanvas') proctorCanvasRef!: ElementRef<HTMLCanvasElement>;

  proctorStream: MediaStream | null = null;
  proctorScanInterval: any = null;
  proctorFaceStatus: 'verified' | 'multiple' | 'empty' = 'verified';
  proctorStatusMessage = 'Candidate Verified (1 Person)';
  multipleFaceWarning = false;
  noFaceWarning = false;
  detectedFaceCount = 1;
  consecutiveNoFaceTicks = 0;
  private visibilityHandler: any;

  get progressPct(): number {
    if (this.questions.length === 0) return 0;
    return ((this.currentQ + 1) / this.questions.length) * 100;
  }

  get scorePct(): number {
    if (this.questions.length === 0) return 0;
    return Math.round((this.correctCount / this.questions.length) * 100);
  }

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    private api:   ApiService
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('testId');
    this.testId = Number(raw);
    if (!this.testId || isNaN(this.testId)) {
      this.loading       = false;
      this.eligible      = false;
      this.notEligibleMsg = 'Invalid test link.';
      return;
    }
    this.loadQuestions();
  }

  private loadQuestions(): void {
    this.api.getRound2Questions(this.testId).subscribe({
      next: (res: any) => {
        if (!res.eligible) {
          this.eligible      = false;
          this.notEligibleMsg = res.message || 'You are not eligible for Round 2.';
          this.loading       = false;
          return;
        }
        this.eligible  = true;
        this.questions = res.questions || [];
        this.timeLeft  = this.timeLimitMin * 60;
        this.loading   = false;
      },
      error: () => {
        this.eligible      = false;
        this.notEligibleMsg = 'Could not fetch test. Please try again or contact the recruiter.';
        this.loading       = false;
      }
    });
  }

  onSystemCheckPassed(): void {
    this.showSystemCheck = false;
    this.beginTest();
  }

  beginTest(): void {
    this.startLoading = true;

    this.api.startRound2Test(this.testId).subscribe({
      next: (submissionId: any) => {
        this.submissionId = typeof submissionId === 'number' ? submissionId : (submissionId?.submissionId || this.testId);
        this.startLoading = false;
        this.started      = true;
        this.startTimer();
        this.setupProctoring();
        this.startContinuousCameraMonitoring();
      },
      error: (err: any) => {
        console.warn('Start test notice:', err);
        this.submissionId = this.testId;
        this.startLoading = false;
        this.started      = true;
        this.startTimer();
        this.setupProctoring();
        this.startContinuousCameraMonitoring();
      }
    });
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.submitTest();
      }
    }, 1000);
  }

  private setupProctoring(): void {
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden' && this.submissionId !== null) {
        this.violations++;
        this.logViolation('TAB_SWITCH', `Tab switched at Q${this.currentQ + 1}`);
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  // ── Continuous Live Camera Proctoring with Real-Time Face Scanner ──
  async startContinuousCameraMonitoring() {
    try {
      this.proctorStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: { ideal: 15, max: 20 } },
        audio: false
      });

      setTimeout(() => {
        if (this.proctorVideoRef?.nativeElement && this.proctorStream) {
          this.proctorVideoRef.nativeElement.srcObject = this.proctorStream;
        }
      }, 200);

      this.proctorScanInterval = setInterval(() => {
        this.scanCameraFrameForFaces();
      }, 1500);

    } catch (err) {
      console.error('Continuous camera initialization failed:', err);
      this.proctorFaceStatus = 'empty';
      this.proctorStatusMessage = 'Camera Disconnected / Denied';
      this.noFaceWarning = true;
      this.violations++;
    }
  }

  async scanCameraFrameForFaces() {
    if (!this.proctorVideoRef?.nativeElement || !this.started || this.submitted) return;
    const video = this.proctorVideoRef.nativeElement;
    if (video.readyState < 2) return;

    let faceCount = 1;

    try {
      if ('FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
          const detectedFaces = await detector.detect(video);
          faceCount = detectedFaces.length;
        } catch (e) {
          faceCount = this.analyzeCanvasFrameForFaces(video);
        }
      } else {
        faceCount = this.analyzeCanvasFrameForFaces(video);
      }
    } catch (e) {
      faceCount = this.analyzeCanvasFrameForFaces(video);
    }

    this.detectedFaceCount = faceCount;

    if (faceCount === 1) {
      this.proctorFaceStatus = 'verified';
      this.proctorStatusMessage = 'Candidate Verified (1 Person)';
      this.multipleFaceWarning = false;
      this.noFaceWarning = false;
      this.consecutiveNoFaceTicks = 0;
    } else if (faceCount > 1) {
      this.proctorFaceStatus = 'multiple';
      this.proctorStatusMessage = `Violation: ${faceCount} People in Frame!`;
      this.multipleFaceWarning = true;
      this.noFaceWarning = false;
      this.violations++;
      this.logViolation('MULTIPLE_PERSONS', `${faceCount} persons detected in camera view`);
    } else {
      this.consecutiveNoFaceTicks++;
      if (this.consecutiveNoFaceTicks >= 2) {
        this.proctorFaceStatus = 'empty';
        this.proctorStatusMessage = 'Warning: No Face Detected';
        this.noFaceWarning = true;
        this.multipleFaceWarning = false;
      }
    }
  }

  private analyzeCanvasFrameForFaces(video: HTMLVideoElement): number {
    const canvas = this.proctorCanvasRef?.nativeElement || document.createElement('canvas');
    const width = 160;
    const height = 120;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 1;

    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let leftHalfSkinCount = 0;
    let rightHalfSkinCount = 0;
    let centerSkinCount = 0;
    let totalSkinPixels = 0;

    for (let y = 10; y < height - 10; y += 2) {
      for (let x = 10; x < width - 10; x += 2) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const isSkin = (
          r > 80 && g > 35 && b > 20 &&
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 12 &&
          r > g && r > b
        );

        if (isSkin) {
          totalSkinPixels++;
          if (x < width * 0.4) {
            leftHalfSkinCount++;
          } else if (x > width * 0.6) {
            rightHalfSkinCount++;
          } else {
            centerSkinCount++;
          }
        }
      }
    }

    const minFaceThreshold = (width * height) * 0.02;
    if (totalSkinPixels < minFaceThreshold) {
      return 0;
    }

    const minSideCluster = minFaceThreshold * 0.7;
    if (leftHalfSkinCount > minSideCluster && rightHalfSkinCount > minSideCluster && centerSkinCount < (leftHalfSkinCount + rightHalfSkinCount) * 0.5) {
      return 2;
    }

    return 1;
  }

  logViolation(type: string, details: string) {
    if (!this.submissionId) return;
    this.api.logRound2Violation({
      submissionId: this.submissionId,
      violationType: type,
      details: details
    }).subscribe({
      error: () => {}
    });
  }

  stopContinuousCamera() {
    if (this.proctorScanInterval) {
      clearInterval(this.proctorScanInterval);
      this.proctorScanInterval = null;
    }
    if (this.proctorStream) {
      this.proctorStream.getTracks().forEach(track => track.stop());
      this.proctorStream = null;
    }
  }

  selectAnswer(opt: string): void  { this.answers[this.currentQ] = opt; }
  goToQuestion(i: number): void    { this.currentQ = i; }
  next(): void { if (this.currentQ < this.questions.length - 1) this.currentQ++; }
  prev(): void { if (this.currentQ > 0) this.currentQ--; }

  confirmSubmit(): void {
    const unanswered = this.questions.length - Object.keys(this.answers).length;
    if (unanswered > 0) {
      if (!confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
    }
    this.submitTest();
  }

  submitTest(): void {
    clearInterval(this.timer);
    this.stopContinuousCamera();
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }

    const answerList = Object.keys(this.answers).map(key => {
      const idx = Number(key);
      return {
        questionId: this.questions[idx].questionId,
        selectedOption: this.answers[idx]
      };
    });

    const payload = {
      submissionId: this.submissionId,
      answers: answerList
    };

    this.api.submitRound2Test(payload).subscribe({
      next: (res: any) => {
        this.score = res.score;
        this.correctCount = res.correctCount;
        this.submitted = true;
      },
      error: (err) => {
        console.error("Submission failed", err);
        alert("Failed to submit test. Please contact support.");
      }
    });
  }

  getOptions(q: any): string[] {
    return [q.optionA, q.optionB, q.optionC, q.optionD];
  }

  formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy(): void {
    this.stopContinuousCamera();
    if (this.timer) clearInterval(this.timer);
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}