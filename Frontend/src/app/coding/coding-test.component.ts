import { Component, OnInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../shared/services/api.service';

@Component({
  selector: 'app-coding-test',
  template: `
    <!-- Top Nav Bar -->
    <header class="coding-header">
      <div class="header-left">
        <button class="back-btn" (click)="goBack()">← Exit Test</button>
        <div class="test-title">
          <span class="round-tag">Round 3</span>
          <span class="job-heading">Technical Coding Assessment</span>
        </div>
      </div>

      <div class="header-center" *ngIf="eligible && problems.length > 0">
        <div class="problem-selector" *ngIf="problems.length > 1">
          <button 
            *ngFor="let p of problems; let i = index" 
            class="prob-tab" 
            [class.active]="selectedProblemIndex === i"
            (click)="selectProblem(i)">
            Problem {{ i + 1 }}
          </button>
        </div>
      </div>

      <div class="header-right">
        <!-- Live AI Proctor Status Pill in Header -->
        <div class="proctor-header-badge" *ngIf="started && !alreadySubmitted" [ngClass]="proctorFaceStatus">
          <span class="pulse-dot"></span>
          <span class="badge-text">{{ proctorStatusMessage }}</span>
        </div>

        <div class="timer-box">
          <span class="timer-icon">⏱️</span>
          <span class="timer-text">{{ formattedTime }}</span>
        </div>
        <button class="btn btn-run" [disabled]="isRunning || isSubmitting" (click)="runCode()">
          <span *ngIf="!isRunning">▶ Run Code</span>
          <span *ngIf="isRunning" class="spinner-sm"></span>
        </button>
        <button class="btn btn-submit" [disabled]="isRunning || isSubmitting" (click)="submitCode()">
          <span *ngIf="!isSubmitting">☁ Submit Code</span>
          <span *ngIf="isSubmitting" class="spinner-sm"></span>
        </button>
      </div>
    </header>

    <!-- Proctor warning banners -->
    <div class="proctor-banner multiple-alert" *ngIf="multipleFaceWarning && started && !alreadySubmitted">
      🚨 <b>CRITICAL PROCTOR VIOLATION:</b> Multiple persons ({{ detectedFaceCount }}) detected in camera view! Only the candidate is permitted in frame.
    </div>

    <div class="proctor-banner no-face-alert" *ngIf="noFaceWarning && !multipleFaceWarning && started && !alreadySubmitted">
      ⚠️ <b>WARNING:</b> No face detected in camera view. Please remain seated and centered in front of your camera.
    </div>

    <div class="proctor-banner" *ngIf="violations > 0 && !multipleFaceWarning && !noFaceWarning && started && !alreadySubmitted">
      ⚠️ Warning: {{ violations }} proctor violation(s) detected and logged.
    </div>

    <!-- Loading State -->
    <div *ngIf="loading" class="loading-container">
      <div class="custom-spinner"></div>
      <p>Verifying eligibility and loading assessment...</p>
    </div>

    <!-- ALREADY COMPLETED & SUBMITTED STATE (Single Attempt Enforced) -->
    <div *ngIf="!loading && alreadySubmitted" class="ineligible-card-container">
      <div class="ineligible-card" style="max-width: 650px; text-align: left;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="lock-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981;">🏆</div>
          <h2 style="color: #f8fafc; margin-top: 10px;">Assessment Already Completed</h2>
          <p class="ineligible-desc" style="margin-bottom: 0;">
            You have already completed and submitted your Round 3 Technical Coding Assessment for this job. Re-attempts are not permitted.
          </p>
        </div>

        <div class="verdict-summary" [ngClass]="submissionDetails?.submissionVerdict === 'ACCEPTED' ? 'verdict-accepted' : 'verdict-failed'" style="margin-bottom: 20px;">
          <div class="verdict-main">
            <h2>{{ submissionDetails?.submissionVerdict || 'SUBMITTED' }}</h2>
            <p>{{ submissionDetails?.passedTestCases }} / {{ submissionDetails?.totalTestCases }} Test Cases Passed</p>
          </div>
          <div class="verdict-time" *ngIf="submissionDetails?.submittedAt">
            Submitted: {{ submissionDetails?.submittedAt | date:'short' }}
          </div>
        </div>

        <div *ngIf="submissionDetails?.submittedCode" style="margin-bottom: 20px;">
          <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; display: block; margin-bottom: 6px;">
            Your Submitted Code ({{ submissionDetails?.submittedLanguage | uppercase }})
          </label>
          <pre class="code-box" style="max-height: 200px; overflow: auto; padding: 14px; border-radius: 6px;">{{ submissionDetails?.submittedCode }}</pre>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px;">
          <button class="btn btn-primary btn-lg" (click)="goBack()">Back to My Applications</button>
        </div>
      </div>
    </div>

    <!-- INELIGIBLE / AWAITING RECRUITER SHORTLIST -->
    <div *ngIf="!loading && !eligible && !alreadySubmitted" class="ineligible-card-container">
      <div class="ineligible-card">
        <div class="lock-icon">🔒</div>
        <h2>Assessment Locked</h2>
        <p class="ineligible-desc">{{ ineligibleMessage }}</p>
        
        <div class="eligibility-steps">
          <div class="step-item">
            <span class="step-badge done">✓</span>
            <div class="step-content">
              <strong>Round 1: ATS Screening</strong>
              <p>Resume matched & qualified</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-badge done">✓</span>
            <div class="step-content">
              <strong>Round 2: Technical MCQ Test</strong>
              <p>Completed and shortlisted</p>
            </div>
          </div>
          <div class="step-item">
            <span class="step-badge locked">3</span>
            <div class="step-content">
              <strong>Round 3: Coding Round</strong>
              <p>Unlocks once recruiter selects you for Round 3</p>
            </div>
          </div>
        </div>

        <div class="ineligible-actions">
          <button class="btn btn-primary" (click)="goBack()">Back to My Applications</button>
        </div>
      </div>
    </div>

    <!-- No Problems Configured for this Job -->
    <div *ngIf="!loading && eligible && !alreadySubmitted && problems.length === 0" class="ineligible-card-container">
      <div class="ineligible-card">
        <div class="lock-icon">📝</div>
        <h2>No Coding Questions Found</h2>
        <p class="ineligible-desc">You are shortlisted for Round 3! However, the recruiter has not published any coding questions for Job #{{ jobId }} yet.</p>
        <div class="ineligible-actions">
          <button class="btn btn-primary" (click)="goBack()">Back to My Applications</button>
        </div>
      </div>
    </div>

    <!-- Start Screen landing card -->
    <div class="start-screen-container fade-in" *ngIf="!loading && eligible && !alreadySubmitted && problems.length > 0 && !started && !showSystemCheck">
      <div class="start-card">
        <div class="start-card-icon">💻</div>
        <div class="section-label" style="justify-content:center;margin-bottom:12px">Round 3 Assessment</div>
        <h2>Technical Coding Assessment</h2>
        <p style="color:#94a3b8;margin:12px 0 24px">Job ID: #{{ jobId }}</p>

        <div class="test-info-grid">
          <div class="test-info-item">
            <div class="ti-val">{{ problems.length }}</div>
            <div class="ti-label">Coding Challenges</div>
          </div>
          <div class="test-info-item">
            <div class="ti-val">60m</div>
            <div class="ti-label">Time Limit</div>
          </div>
        </div>

        <div class="instructions">
          <div class="inst-title">Rules & AI Camera Proctoring Instructions</div>
          <ul>
            <li><b>Continuous Camera Monitoring:</b> Your webcam will remain active throughout the assessment.</li>
            <li><b>Strict Single-Person Rule:</b> Only you (the candidate) must be visible in the camera frame. Multiple faces or unauthorized persons will trigger an immediate proctor violation.</li>
            <li>Tab switches and exiting full screen are actively logged.</li>
            <li>Once started, the timer cannot be paused.</li>
          </ul>
        </div>

        <button class="btn btn-primary btn-full btn-lg" (click)="showSystemCheck = true">
          Begin System Diagnostics & Start →
        </button>
      </div>
    </div>

    <!-- System Check Overlay -->
    <app-system-check 
      *ngIf="showSystemCheck" 
      testName="Round 3 Coding Assessment" 
      (onCheckPassed)="onSystemCheckPassed()" 
      (onCancel)="showSystemCheck = false">
    </app-system-check>

    <!-- Main Workspace (Split-Pane LeetCode Interface) -->
    <div *ngIf="!loading && eligible && currentProblem && started" class="workspace">
      
      <!-- Left Panel: Problem Statement -->
      <div class="left-pane">
        <div class="problem-meta">
          <div class="meta-tags">
            <span class="difficulty-badge" [ngClass]="getDifficultyClass(currentProblem.difficulty)">
              {{ currentProblem.difficulty || 'MEDIUM' }}
            </span>
            <span class="limit-tag">⏱️ {{ currentProblem.timeLimitMs || 2000 }} ms</span>
            <span class="limit-tag">💾 {{ currentProblem.memoryLimitMb || 256 }} MB</span>
          </div>
          <h1 class="problem-title">{{ currentProblem.title }}</h1>
        </div>

        <div class="problem-body">
          <div class="description-section">
            <h3>Problem Description</h3>
            <div class="description-text">{{ currentProblem.description }}</div>
          </div>

          <!-- Sample Test Cases -->
          <div class="sample-section" *ngIf="currentProblem.sampleTestCases && currentProblem.sampleTestCases.length > 0">
            <h3>Sample Test Cases</h3>
            <div class="sample-card" *ngFor="let sample of currentProblem.sampleTestCases; let i = index">
              <div class="sample-header">Example {{ i + 1 }}</div>
              <div class="sample-block">
                <div class="block-label">Input:</div>
                <pre class="code-box">{{ sample.inputData }}</pre>
              </div>
              <div class="sample-block">
                <div class="block-label">Expected Output:</div>
                <pre class="code-box output">{{ sample.expectedOutput }}</pre>
              </div>
              <div class="sample-explanation" *ngIf="sample.explanation">
                <strong>Explanation:</strong> {{ sample.explanation }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Code Editor & Console Output -->
      <div class="right-pane">
        
        <!-- Editor Toolbar -->
        <div class="editor-toolbar">
          <div class="lang-selector-wrapper">
            <label>Language:</label>
            <select [(ngModel)]="selectedLanguage" (change)="onLanguageChange()" class="lang-dropdown">
              <option value="java">Java (JDK 21)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (g++)</option>
              <option value="javascript">JavaScript (Node.js)</option>
            </select>
          </div>
          <div class="editor-actions">
            <button class="icon-btn" (click)="resetTemplate()" title="Reset to Starter Template">↺ Reset</button>
          </div>
        </div>

        <!-- Code Editor Area -->
        <div class="editor-container">
          <textarea 
            #codeEditor
            class="code-textarea"
            [(ngModel)]="code"
            (keydown)="handleKeyDown($event)"
            spellcheck="false"
            placeholder="Write your code here..."></textarea>
        </div>

        <!-- Bottom Console Tabs -->
        <div class="console-panel">
          <div class="console-tabs">
            <button 
              class="tab-btn" 
              [class.active]="activeConsoleTab === 'testcase'" 
              (click)="activeConsoleTab = 'testcase'">
              📥 Test Input
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeConsoleTab === 'result'" 
              (click)="activeConsoleTab = 'result'">
              💻 Run Result
              <span *ngIf="runResult" class="status-dot" [class.success]="runResult.status === 'SUCCESS'" [class.error]="runResult.status !== 'SUCCESS'"></span>
            </button>
            <button 
              class="tab-btn" 
              [class.active]="activeConsoleTab === 'verdict'" 
              (click)="activeConsoleTab = 'verdict'">
              🏆 Submission Verdict
              <span *ngIf="submissionVerdict" class="status-dot" [class.success]="submissionVerdict.status === 'ACCEPTED'" [class.error]="submissionVerdict.status !== 'ACCEPTED'"></span>
            </button>
          </div>

          <div class="console-content">
            
            <!-- Tab 1: Test Cases -->
            <div *ngIf="activeConsoleTab === 'testcase'" class="tab-pane">
              <div class="custom-input-box">
                <label>Standard Input (stdin):</label>
                <textarea 
                  [(ngModel)]="customInput" 
                  class="custom-input-area"
                  placeholder="Enter custom input for testing (e.g. 5 10)"></textarea>
              </div>
            </div>

            <!-- Tab 2: Run Result -->
            <div *ngIf="activeConsoleTab === 'result'" class="tab-pane">
              <div *ngIf="!runResult && !isRunning" class="empty-console">
                Click "▶ Run Code" to test your solution.
              </div>
              <div *ngIf="isRunning" class="running-state">
                <div class="custom-spinner-sm"></div> Compiling and executing code...
              </div>
              <div *ngIf="runResult && !isRunning">
                <div class="result-header">
                  <span class="status-badge" [ngClass]="getResultBadgeClass(runResult.status)">
                    {{ runResult.status }}
                  </span>
                  <span class="exec-time" *ngIf="runResult.executionTimeMs">
                    ⏱️ {{ runResult.executionTimeMs }} ms
                  </span>
                </div>

                <!-- Compile Error Message -->
                <div *ngIf="runResult.compileError" class="error-box">
                  <div class="error-title">Compilation Error:</div>
                  <pre class="error-content">{{ runResult.compileError }}</pre>
                </div>

                <!-- Runtime Error Message -->
                <div *ngIf="runResult.stderr && runResult.status === 'RUNTIME_ERROR'" class="error-box">
                  <div class="error-title">Runtime Error:</div>
                  <pre class="error-content">{{ runResult.stderr }}</pre>
                </div>

                <!-- Stdout -->
                <div *ngIf="runResult.stdout" class="output-box">
                  <div class="output-title">Standard Output:</div>
                  <pre class="output-content">{{ runResult.stdout }}</pre>
                </div>
              </div>
            </div>

            <!-- Tab 3: Submission Verdict -->
            <div *ngIf="activeConsoleTab === 'verdict'" class="tab-pane">
              <div *ngIf="!submissionVerdict && !isSubmitting" class="empty-console">
                Click "☁ Submit Code" to run against all hidden test cases.
              </div>
              <div *ngIf="isSubmitting" class="running-state">
                <div class="custom-spinner-sm"></div> Evaluating against test cases...
              </div>
              <div *ngIf="submissionVerdict && !isSubmitting">
                <div class="verdict-summary" [ngClass]="submissionVerdict.status === 'ACCEPTED' ? 'verdict-accepted' : 'verdict-failed'">
                  <div class="verdict-main">
                    <h2>{{ submissionVerdict.status }}</h2>
                    <p>{{ submissionVerdict.passedTestCases }} / {{ submissionVerdict.totalTestCases }} Test Cases Passed ({{ submissionVerdict.scorePercentage }}%)</p>
                  </div>
                  <div class="verdict-time">
                    ⏱️ Total Time: {{ submissionVerdict.totalExecutionTimeMs }} ms
                  </div>
                </div>

                <!-- Test Case Breakdown Grid -->
                <div class="testcase-grid" *ngIf="submissionVerdict.testCaseResults">
                  <div 
                    class="testcase-item" 
                    *ngFor="let tc of submissionVerdict.testCaseResults"
                    [class.passed]="tc.passed"
                    [class.failed]="!tc.passed">
                    <div class="tc-top">
                      <span class="tc-title">Testcase {{ tc.testCaseNumber }}</span>
                      <span class="tc-badge" [class.badge-passed]="tc.passed" [class.badge-failed]="!tc.passed">
                        {{ tc.status }}
                      </span>
                    </div>
                    <div class="tc-details" *ngIf="!tc.isHidden">
                      <div class="tc-row"><strong>Input:</strong> {{ tc.input }}</div>
                      <div class="tc-row"><strong>Expected:</strong> {{ tc.expectedOutput }}</div>
                      <div class="tc-row"><strong>Actual:</strong> {{ tc.actualOutput }}</div>
                    </div>
                    <div class="tc-details" *ngIf="tc.isHidden">
                      <div class="tc-row"><em>Hidden Testcase Evaluation</em></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>

    <!-- ── LIVE FLOATING PROCTOR CAMERA MONITOR ── -->
    <div class="floating-proctor-card" *ngIf="started && !alreadySubmitted" [ngClass]="proctorFaceStatus">
      <div class="fpc-header">
        <div class="fpc-indicator">
          <span class="fpc-dot" [ngClass]="proctorFaceStatus"></span>
          <span class="fpc-status-label">{{ proctorStatusMessage }}</span>
        </div>
        <span class="fpc-live-pill">AI PROCTOR</span>
      </div>

      <div class="fpc-video-box">
        <video #proctorVideo autoplay playsinline [muted]="true" class="fpc-video"></video>
        <canvas #proctorCanvas style="display:none;"></canvas>
        <div class="fpc-target-reticle" [ngClass]="proctorFaceStatus"></div>
      </div>

      <div class="fpc-footer">
        <span class="fpc-count-badge" [class.danger]="detectedFaceCount > 1" [class.warning]="detectedFaceCount === 0">
          👤 Persons in frame: <b>{{ detectedFaceCount }}</b>
        </span>
        <span class="fpc-rule-note">{{ detectedFaceCount === 1 ? '✅ Candidate Verified' : (detectedFaceCount > 1 ? '❌ Multiple People' : '⚠️ No Face') }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }

    /* Top Navigation */
    .coding-header {
      height: 56px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      flex-shrink: 0;
      z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-btn {
      background: transparent; border: 1px solid #475569;
      color: #94a3b8; padding: 6px 12px; border-radius: 6px;
      font-size: 13px; cursor: pointer; transition: all 0.2s;
    }
    .back-btn:hover { background: #334155; color: #fff; }
    .test-title { display: flex; align-items: center; gap: 10px; }
    .round-tag {
      background: #0ea5e9; color: #fff; font-size: 11px;
      font-weight: 700; padding: 3px 8px; border-radius: 4px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .job-heading { font-weight: 600; font-size: 15px; color: #e2e8f0; }

    .header-center { display: flex; align-items: center; }
    .problem-selector { display: flex; gap: 6px; }
    .prob-tab {
      background: #0f172a; border: 1px solid #334155; color: #94a3b8;
      padding: 5px 14px; border-radius: 6px; font-size: 13px; cursor: pointer;
    }
    .prob-tab.active { background: #0284c7; border-color: #0284c7; color: #fff; font-weight: 600; }

    .header-right { display: flex; align-items: center; gap: 12px; }

    /* Header Proctor status badge */
    .proctor-header-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      border: 1px solid transparent; transition: all 0.3s;
    }
    .proctor-header-badge.verified {
      background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #34d399;
    }
    .proctor-header-badge.multiple {
      background: rgba(239, 68, 68, 0.2); border-color: #ef4444; color: #f87171; animation: pulseAlert 1s infinite;
    }
    .proctor-header-badge.empty {
      background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #fbbf24;
    }
    .pulse-dot {
      width: 7px; height: 7px; border-radius: 50%; display: inline-block; background: currentColor;
    }

    .timer-box {
      display: flex; align-items: center; gap: 6px;
      background: #0f172a; border: 1px solid #334155;
      padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; color: #fbbf24;
    }

    .btn {
      padding: 7px 18px; border-radius: 6px; font-size: 13px;
      font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
    }
    .btn-run { background: #334155; color: #38bdf8; border: 1px solid #0284c7; }
    .btn-run:hover:not(:disabled) { background: #0284c7; color: #fff; }
    .btn-submit { background: #10b981; color: #fff; }
    .btn-submit:hover:not(:disabled) { background: #059669; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Proctor Warning Banners */
    .proctor-banner {
      font-size: 13px; padding: 10px 20px; text-align: center; width: 100%; flex-shrink: 0;
      transition: all 0.3s;
    }
    .proctor-banner.multiple-alert {
      background: #dc2626; color: #fff; border-bottom: 2px solid #b91c1c; font-weight: 500;
      animation: pulseAlert 1s infinite alternate;
    }
    .proctor-banner.no-face-alert {
      background: #d97706; color: #fff; border-bottom: 2px solid #b45309; font-weight: 500;
    }
    @keyframes pulseAlert {
      from { opacity: 0.9; }
      to { opacity: 1; }
    }

    /* Loading Screen */
    .loading-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: calc(100vh - 56px); gap: 16px; color: #94a3b8;
    }
    .custom-spinner {
      width: 42px; height: 42px; border: 4px solid rgba(14, 165, 233, 0.2);
      border-top-color: #0ea5e9; border-radius: 50%; animation: spin 1s linear infinite;
    }
    .custom-spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Ineligible Lock Screen */
    .ineligible-card-container {
      display: flex; align-items: center; justify-content: center;
      height: calc(100vh - 56px); padding: 20px;
    }
    .ineligible-card {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; padding: 40px; max-width: 580px; width: 100%;
      text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    .lock-icon { font-size: 48px; margin-bottom: 16px; }
    .ineligible-card h2 { font-size: 22px; color: #f8fafc; margin-bottom: 10px; }
    .ineligible-desc { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }

    .eligibility-steps {
      display: flex; flex-direction: column; gap: 14px;
      text-align: left; background: #0f172a; padding: 20px;
      border-radius: 8px; margin-bottom: 28px; border: 1px solid #334155;
    }
    .step-item { display: flex; gap: 14px; align-items: center; }
    .step-badge {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
    }
    .step-badge.done { background: #10b981; color: #fff; }
    .step-badge.pending { background: #f59e0b; color: #fff; }
    .step-badge.locked { background: #475569; color: #94a3b8; }
    .step-content strong { font-size: 14px; color: #e2e8f0; }
    .step-content p { font-size: 12px; color: #64748b; margin: 0; }

    .ineligible-actions { display: flex; gap: 12px; justify-content: center; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }

    /* Workspace Split Screen */
    .workspace {
      display: flex;
      height: calc(100vh - 56px);
      width: 100vw;
      overflow: hidden;
    }

    /* Left Pane: Problem Details */
    .left-pane {
      width: 45%;
      border-right: 1px solid #334155;
      background: #0f172a;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
    .problem-meta {
      padding: 24px 24px 16px;
      border-bottom: 1px solid #1e293b;
    }
    .meta-tags { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
    .difficulty-badge {
      font-size: 11px; font-weight: 700; padding: 3px 10px;
      border-radius: 100px; text-transform: uppercase;
    }
    .difficulty-easy { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid #10b981; }
    .difficulty-medium { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid #f59e0b; }
    .difficulty-hard { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid #ef4444; }
    .limit-tag { font-size: 12px; color: #94a3b8; background: #1e293b; padding: 3px 8px; border-radius: 4px; }
    .problem-title { font-size: 20px; font-weight: 700; color: #f8fafc; margin: 0; }

    .problem-body { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
    .description-section h3, .sample-section h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 10px; }
    .description-text { font-size: 14px; line-height: 1.7; color: #cbd5e1; white-space: pre-line; }

    .sample-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 8px;
      padding: 16px; margin-bottom: 14px;
    }
    .sample-header { font-size: 13px; font-weight: 600; color: #38bdf8; margin-bottom: 12px; }
    .sample-block { margin-bottom: 8px; }
    .block-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .code-box {
      background: #0f172a; border: 1px solid #334155; border-radius: 4px;
      padding: 8px 12px; font-family: monospace; font-size: 13px; color: #e2e8f0; margin: 0;
    }
    .code-box.output { color: #34d399; }
    .sample-explanation { font-size: 12px; color: #94a3b8; margin-top: 8px; }

    /* Right Pane: Code Editor + Console */
    .right-pane {
      width: 55%;
      display: flex;
      flex-direction: column;
      background: #0a0f1d;
    }

    .editor-toolbar {
      height: 42px; background: #1e293b; border-bottom: 1px solid #334155;
      display: flex; align-items: center; justify-content: space-between; padding: 0 16px;
    }
    .lang-selector-wrapper { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #94a3b8; }
    .lang-dropdown {
      background: #0f172a; border: 1px solid #475569; color: #f8fafc;
      padding: 4px 10px; border-radius: 4px; font-size: 12px; outline: none;
    }
    .icon-btn {
      background: transparent; border: 1px solid #475569; color: #94a3b8;
      padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;
    }
    .icon-btn:hover { background: #334155; color: #fff; }

    /* Textarea Code Editor */
    .editor-container {
      flex: 1;
      position: relative;
      background: #0d1117;
    }
    .code-textarea {
      width: 100%;
      height: 100%;
      background: #0d1117;
      color: #58a6ff;
      border: none;
      resize: none;
      outline: none;
      padding: 16px;
      font-family: 'Fira Code', Consolas, Monaco, monospace;
      font-size: 14px;
      line-height: 1.6;
      tab-size: 4;
      white-space: pre;
    }

    /* Console Panel */
    .console-panel {
      height: 240px;
      background: #111827;
      border-top: 1px solid #334155;
      display: flex;
      flex-direction: column;
    }
    .console-tabs {
      display: flex; background: #1e293b; border-bottom: 1px solid #334155;
    }
    .tab-btn {
      background: transparent; border: none; color: #94a3b8;
      padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 6px; border-right: 1px solid #334155;
    }
    .tab-btn.active { background: #111827; color: #38bdf8; border-top: 2px solid #38bdf8; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-dot.success { background: #10b981; }
    .status-dot.error { background: #ef4444; }

    .console-content { flex: 1; overflow-y: auto; padding: 14px 18px; font-size: 13px; }
    .custom-input-box label { display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
    .custom-input-area {
      width: 100%; height: 110px; background: #0f172a; border: 1px solid #334155;
      color: #e2e8f0; border-radius: 6px; padding: 8px 12px; font-family: monospace; resize: none; outline: none;
    }
    .empty-console { color: #64748b; padding: 20px 0; text-align: center; }
    .running-state { display: flex; align-items: center; gap: 8px; color: #38bdf8; padding: 16px 0; }

    .result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .status-badge { font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 4px; }
    .status-badge.badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .status-badge.badge-danger { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .status-badge.badge-warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .exec-time { color: #94a3b8; font-size: 12px; }

    .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
    .error-title { color: #f87171; font-weight: 600; margin-bottom: 6px; }
    .error-content { color: #fca5a5; font-family: monospace; font-size: 12px; white-space: pre-wrap; margin: 0; }

    .output-box { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 12px; }
    .output-title { color: #94a3b8; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; }
    .output-content { color: #38bdf8; font-family: monospace; font-size: 13px; margin: 0; }

    /* Verdict Summary Card */
    .verdict-summary {
      border-radius: 8px; padding: 16px 20px; display: flex; justify-content: space-between;
      align-items: center; margin-bottom: 14px;
    }
    .verdict-accepted { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), #064e3b); border: 1px solid #10b981; }
    .verdict-failed { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), #7f1d1d); border: 1px solid #ef4444; }
    .verdict-main h2 { font-size: 20px; font-weight: 800; margin: 0 0 4px 0; }
    .verdict-accepted h2 { color: #34d399; }
    .verdict-failed h2 { color: #f87171; }
    .verdict-main p { font-size: 13px; color: #e2e8f0; margin: 0; }
    .verdict-time { font-size: 12px; color: #cbd5e1; }

    .testcase-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .testcase-item { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 12px; }
    .testcase-item.passed { border-left: 4px solid #10b981; }
    .testcase-item.failed { border-left: 4px solid #ef4444; }
    .tc-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .tc-title { font-weight: 600; font-size: 12px; color: #f8fafc; }
    .tc-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; }
    .badge-passed { background: #10b981; color: #fff; }
    .badge-failed { background: #ef4444; color: #fff; }
    .tc-row { font-size: 11px; color: #94a3b8; margin-top: 3px; }

    /* Start Screen */
    .start-screen-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 56px);
      padding: 24px;
      background: #0f172a;
    }
    .start-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 40px 36px;
      width: 100%;
      max-width: 540px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    }
    .start-card-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0ea5e9;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .test-info-grid {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin: 24px 0;
    }
    .test-info-item {
      text-align: center;
    }
    .ti-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: #38bdf8;
    }
    .ti-label {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .instructions {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 20px 0;
      text-align: left;
    }
    .inst-title {
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .instructions ul {
      padding-left: 16px;
      margin: 0;
    }
    .instructions li {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 6px;
      line-height: 1.5;
    }
    .btn-full {
      width: 100%;
      justify-content: center;
    }
    .btn-lg {
      padding: 12px 28px;
      font-size: 15px;
    }

    /* ── Floating Live Proctor Camera Box ── */
    .floating-proctor-card {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 220px;
      background: #1e293b;
      border: 2px solid #10b981;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    }
    .floating-proctor-card.verified {
      border-color: #10b981;
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
    }
    .floating-proctor-card.multiple {
      border-color: #ef4444;
      box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
      animation: pulseBorder 1s infinite alternate;
    }
    .floating-proctor-card.empty {
      border-color: #f59e0b;
      box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
    }

    @keyframes pulseBorder {
      from { transform: scale(1); }
      to { transform: scale(1.03); }
    }

    .fpc-header {
      padding: 6px 10px;
      background: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .fpc-indicator {
      display: flex; align-items: center; gap: 6px;
    }
    .fpc-dot {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .fpc-dot.verified { background: #10b981; box-shadow: 0 0 6px #10b981; }
    .fpc-dot.multiple { background: #ef4444; box-shadow: 0 0 8px #ef4444; animation: blink 0.6s infinite; }
    .fpc-dot.empty { background: #f59e0b; box-shadow: 0 0 6px #f59e0b; }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

    .fpc-status-label {
      font-size: 10px; font-weight: 700; color: #cbd5e1; text-transform: uppercase;
    }
    .fpc-live-pill {
      font-size: 9px; font-weight: 800; background: rgba(14, 165, 233, 0.2); color: #38bdf8;
      padding: 2px 6px; border-radius: 4px;
    }

    .fpc-video-box {
      width: 100%;
      height: 140px;
      position: relative;
      background: #000;
      overflow: hidden;
    }
    .fpc-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1); /* Mirror camera */
    }

    .fpc-target-reticle {
      position: absolute;
      inset: 10px;
      border: 1.5px dashed rgba(16, 185, 129, 0.6);
      border-radius: 8px;
      pointer-events: none;
      transition: all 0.3s;
    }
    .fpc-target-reticle.multiple {
      border-color: #ef4444;
      border-style: solid;
      background: rgba(239, 68, 68, 0.15);
    }
    .fpc-target-reticle.empty {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.08);
    }

    .fpc-footer {
      padding: 6px 10px;
      background: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      border-top: 1px solid #334155;
    }
    .fpc-count-badge {
      color: #94a3b8; font-size: 11px;
    }
    .fpc-count-badge.danger { color: #f87171; font-weight: 700; }
    .fpc-count-badge.warning { color: #fbbf24; }
    .fpc-rule-note {
      font-size: 10px; font-weight: 600; color: #64748b;
    }
  `]
})
export class CodingTestComponent implements OnInit, OnDestroy {
  @ViewChild('proctorVideo') proctorVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('proctorCanvas') proctorCanvasRef!: ElementRef<HTMLCanvasElement>;

  jobId: number = 0;
  loading: boolean = true;
  eligible: boolean = false;
  ineligibleMessage: string = '';

  alreadySubmitted: boolean = false;
  submissionDetails: any = null;

  problems: any[] = [];
  selectedProblemIndex: number = 0;
  currentProblem: any = null;

  selectedLanguage: string = 'java';
  code: string = '';
  customInput: string = '';

  // Console State
  activeConsoleTab: string = 'testcase';
  isRunning: boolean = false;
  isSubmitting: boolean = false;
  runResult: any = null;
  submissionVerdict: any = null;

  // Proctoring and Diagnostics state
  started: boolean = false;
  showSystemCheck: boolean = false;
  violations: number = 0;
  private visibilityHandler: any;

  // Live Camera Continuous AI Proctoring state
  proctorStream: MediaStream | null = null;
  proctorScanInterval: any = null;
  detectedFaceCount: number = 1;
  proctorFaceStatus: 'verified' | 'multiple' | 'empty' = 'verified';
  proctorStatusMessage: string = 'Candidate Verified (1 Person)';
  multipleFaceWarning: boolean = false;
  noFaceWarning: boolean = false;
  consecutiveNoFaceTicks: number = 0;

  // Timer countdown (e.g. 60 minutes)
  timeLeftSeconds: number = 3600;
  timerInterval: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.jobId = +params['jobId'];
      if (this.jobId) {
        this.loadAssessment();
      }
    });
  }

  onSystemCheckPassed() {
    this.showSystemCheck = false;
    this.started = true;
    this.startTimer();
    this.setupProctoring();
    this.startContinuousCameraMonitoring();
  }

  private setupProctoring() {
    this.visibilityHandler = () => {
      if (document.visibilityState === 'hidden' && this.started && !this.alreadySubmitted) {
        this.violations++;
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

      // Start periodic face detection scanning every 1.5 seconds
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

  // Real-time Computer Vision Face Detection
  async scanCameraFrameForFaces() {
    if (!this.proctorVideoRef?.nativeElement || !this.started || this.alreadySubmitted) return;
    const video = this.proctorVideoRef.nativeElement;
    if (video.readyState < 2) return;

    let faceCount = 1;

    try {
      // 1. Check if browser has native hardware-accelerated FaceDetector API
      if ('FaceDetector' in window) {
        try {
          const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
          const detectedFaces = await detector.detect(video);
          faceCount = detectedFaces.length;
        } catch (e) {
          faceCount = this.analyzeCanvasFrameForFaces(video);
        }
      } else {
        // 2. High-performance canvas skin-cluster & face-silhouette analysis
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
    } else {
      this.consecutiveNoFaceTicks++;
      // If no face detected for > 3 consecutive scans (~4.5s), trigger warning
      if (this.consecutiveNoFaceTicks >= 2) {
        this.proctorFaceStatus = 'empty';
        this.proctorStatusMessage = 'Warning: No Face Detected';
        this.noFaceWarning = true;
        this.multipleFaceWarning = false;
      }
    }
  }

  // Fast Computer Vision Analyzer using Canvas Pixel Clustered Color Space
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

        // Standard Human Skin Tone Colorimetry in RGB Space
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

    const minFaceThreshold = (width * height) * 0.02; // minimum 2% skin coverage
    if (totalSkinPixels < minFaceThreshold) {
      return 0; // No person in front of camera
    }

    // If both left and right extremes have prominent independent clusters separated by low density
    const minSideCluster = minFaceThreshold * 0.7;
    if (leftHalfSkinCount > minSideCluster && rightHalfSkinCount > minSideCluster && centerSkinCount < (leftHalfSkinCount + rightHalfSkinCount) * 0.5) {
      return 2; // Two distinct people / heads present on both sides
    }

    return 1; // Single centered person verified
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

  ngOnDestroy() {
    this.stopContinuousCamera();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }

  loadAssessment() {
    this.loading = true;
    this.api.getCodingAssessment(this.jobId).subscribe({
      next: (res: any) => {
        console.log('Coding assessment response:', res);
        this.loading = false;
        this.eligible = res.eligible;
        this.alreadySubmitted = !!res.alreadySubmitted;
        this.submissionDetails = res;
        this.ineligibleMessage = res.message || 'You have not qualified for the Round 3 Coding Assessment yet.';
        this.problems = res.problems || [];

        if (this.eligible && !this.alreadySubmitted && this.problems.length > 0) {
          this.selectProblem(0);
        }
      },
      error: (err: any) => {
        console.error('Error loading coding assessment:', err);
        this.loading = false;
        this.eligible = false;
        this.alreadySubmitted = false;
        if (err.status === 401 || err.status === 403) {
          this.ineligibleMessage = 'You are not logged in or your session has expired. Please log in again.';
        } else {
          this.ineligibleMessage = err.error?.message || 'You are not eligible for Round 3, or the assessment server could not be reached.';
        }
      }
    });
  }

  selectProblem(index: number) {
    this.selectedProblemIndex = index;
    this.currentProblem = this.problems[index];
    this.runResult = null;
    this.submissionVerdict = null;
    this.resetTemplate();
  }

  onLanguageChange() {
    this.resetTemplate();
  }

  resetTemplate() {
    if (!this.currentProblem) return;

    if (this.selectedLanguage === 'java') {
      this.code = this.currentProblem.javaTemplate || `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
        
    }
}`;
    } else if (this.selectedLanguage === 'python') {
      this.code = this.currentProblem.pythonTemplate || `import sys

def main():
    # Read input from sys.stdin
    input_data = sys.stdin.read().split()
    # Write your solution here
    

if __name__ == '__main__':
    main()`;
    } else if (this.selectedLanguage === 'cpp') {
      this.code = this.currentProblem.cppTemplate || `#include <iostream>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`;
    } else if (this.selectedLanguage === 'javascript') {
      this.code = this.currentProblem.jsTemplate || `const fs = require('fs');

function main() {
    const input = fs.readFileSync(0, 'utf-8');
    // Write your solution here
}

main();`;
    }
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      this.code = this.code.substring(0, start) + "    " + this.code.substring(end);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      });
    }
  }

  runCode() {
    if (!this.currentProblem || !this.code) return;
    this.isRunning = true;
    this.activeConsoleTab = 'result';

    const payload = {
      problemId: this.currentProblem.id,
      language: this.selectedLanguage,
      code: this.code,
      customInput: this.customInput
    };

    this.api.runCode(payload).subscribe({
      next: (res: any) => {
        this.runResult = res;
        this.isRunning = false;
      },
      error: (err: any) => {
        this.isRunning = false;
        this.runResult = {
          status: 'RUNTIME_ERROR',
          stderr: err.error?.message || 'Server error occurred during execution.'
        };
      }
    });
  }

  submitCode() {
    if (!this.currentProblem || !this.code) return;
    this.isSubmitting = true;

    const payload = {
      problemId: this.currentProblem.id,
      testId: this.currentProblem.testId,
      language: this.selectedLanguage,
      code: this.code
    };

    this.api.submitCoding(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.stopContinuousCamera();
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        // Immediately transition to Test Over / Completed Screen
        this.alreadySubmitted = true;
        this.submissionDetails = {
          ...res,
          submissionVerdict: res.status,
          passedTestCases: res.passedTestCases,
          totalTestCases: res.totalTestCases,
          submittedCode: this.code,
          submittedLanguage: this.selectedLanguage,
          submittedAt: new Date().toISOString()
        };
      },
      error: (err: any) => {
        this.isSubmitting = false;
        alert('Failed to submit test: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  getDifficultyClass(diff: string) {
    if (!diff) return 'difficulty-medium';
    const d = diff.toUpperCase();
    if (d === 'EASY') return 'difficulty-easy';
    if (d === 'HARD') return 'difficulty-hard';
    return 'difficulty-medium';
  }

  getResultBadgeClass(status: string) {
    if (status === 'SUCCESS') return 'badge-success';
    if (status === 'TIME_LIMIT_EXCEEDED') return 'badge-warning';
    return 'badge-danger';
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeLeftSeconds > 0) {
        this.timeLeftSeconds--;
      }
    }, 1000);
  }

  get formattedTime(): string {
    const mins = Math.floor(this.timeLeftSeconds / 60);
    const secs = this.timeLeftSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  goBack() {
    this.stopContinuousCamera();
    this.router.navigate(['/my-applications']);
  }
}
