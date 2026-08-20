import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-recruiter-applicants',
  template: `
    <app-navbar></app-navbar>
    <div class="page-layout">
      <div class="fade-in">
        <button class="btn btn-ghost btn-sm" (click)="back()">← Back to Dashboard</button>

        <div class="page-header">
          <div>
            <div class="section-label">Hiring Pipeline</div>
            <h2>Applicants for Job #{{ jobId }}</h2>
          </div>
          <div class="pipeline-actions">
            <!-- Round 4 Interview Hub Options Button -->
            <button class="btn btn-primary" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); border: none;" (click)="openRound4OptionsModal(null)">
              🎙️ Round 4 Options
            </button>
            <button class="btn btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); border: none; margin-left: 10px; font-weight: 700;" (click)="downloadSelectedCandidatesCsv()">
              📊 Download CSV of Selected Candidates
            </button>
            <button class="btn btn-outline" style="margin-left: 10px;" (click)="manageMcq()">🎯 Manage MCQ</button>
            <button class="btn btn-outline" style="margin-left: 10px;" (click)="manageCoding()">💻 Manage Coding</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-row" *ngIf="!loading">
          <div class="stat-card">
            <div class="stat-value">{{ applicants.length }}</div>
            <div class="stat-label">Total Applicants</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color: #8b5cf6">{{ inInterview }}</div>
            <div class="stat-label">In Interview (R4)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--teal)">{{ selected }}</div>
            <div class="stat-label">Hired / Selected</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--red)">{{ rejected }}</div>
            <div class="stat-label">Rejected</div>
          </div>
        </div>

        <!-- ── ROUND 4 RECRUITER OPTIONS MODAL ── -->
        <div class="modal-overlay" *ngIf="showRound4OptionsModal">
          <div class="modal-card fade-in">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">🎙️</span>
                <div>
                  <h3 style="margin: 0; color: #f8fafc; font-size: 18px;">Round 4 (Interview Round) Options</h3>
                  <p style="margin: 2px 0 0; font-size: 13px; color: var(--text-secondary);">
                    {{ targetApplicant ? 'Selected for ' + targetApplicant.applicantName : 'Choose how you want to conduct Round 4 for Job #' + jobId }}
                  </p>
                </div>
              </div>
              <button class="close-btn" (click)="closeRound4OptionsModal()">✕</button>
            </div>

            <!-- Main Options List -->
            <div class="options-grid" *ngIf="!showScheduleFormInsideModal && !showEmailPromptInsideModal && !showCallCandidateModal">
              <!-- Choice 1: Schedule on Platform (Slot Window Announcement) -->
              <div class="option-box" (click)="chooseScheduleOnPlatform()">
                <div class="opt-icon" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa;">📅</div>
                <div class="opt-content">
                  <h4 style="margin: 0 0 4px; color: #f8fafc;">1. Set Time Slot Window & Notify Candidates</h4>
                  <p style="margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                    Set your interview day and active time slot (e.g., 2:00 PM – 6:00 PM). Candidates are notified to stay alert and join within 2 minutes when their live call link is generated.
                  </p>
                </div>
                <button class="btn btn-primary btn-sm" style="background: #8b5cf6; border-color: #8b5cf6;">
                  Configure Slot →
                </button>
              </div>

              <!-- Choice 2: Download Excel File -->
              <div class="option-box" (click)="downloadApplicantsExcel()">
                <div class="opt-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">📥</div>
                <div class="opt-content">
                  <h4 style="margin: 0 0 4px; color: #f8fafc;">2. Download Shortlisted Candidates Excel (.xlsx / .csv)</h4>
                  <p style="margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                    Instantly export an official spreadsheet file containing candidate contact details, ATS match %, MCQ test scores, and Coding problem results.
                  </p>
                </div>
                <button class="btn btn-outline btn-sm" [disabled]="downloadLoading" style="color: #34d399; border-color: #10b981;">
                  <span *ngIf="!downloadLoading">Download File ⬇</span>
                  <div *ngIf="downloadLoading" class="spinner" style="width:14px;height:14px;border-width:2px"></div>
                </button>
              </div>

              <!-- Choice 3: Send Excel to Recruiter Email (Prompts for Email Address) -->
              <div class="option-box" (click)="chooseEmailOption()">
                <div class="opt-icon" style="background: rgba(2, 132, 199, 0.15); color: #38bdf8;">✉️</div>
                <div class="opt-content">
                  <h4 style="margin: 0 0 4px; color: #f8fafc;">3. Send Shortlisted Candidates CSV to Email</h4>
                  <p style="margin: 0; font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
                    Specify any email address to receive the candidate list and evaluation performance spreadsheet directly as an attachment.
                  </p>
                </div>
                <button class="btn btn-outline btn-sm" style="color: #38bdf8; border-color: #0284c7;">
                  Enter Email & Send ✉️
                </button>
              </div>
            </div>

            <!-- Inline Form for Option 1: Schedule Time Slot Window -->
            <div class="schedule-form-container" *ngIf="showScheduleFormInsideModal">
              <button class="btn btn-ghost btn-sm" style="margin-bottom: 12px;" (click)="showScheduleFormInsideModal = false">
                ← Back to Options
              </button>
              <h4 style="margin: 0 0 6px; color: #a78bfa;">
                📅 Announce Interview Day & Time Slot Window
              </h4>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
                Candidates will receive an email instructing them to keep their dashboard open during this slot. You can call each candidate turn-by-turn with a 2-minute join timer.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group">
                  <label class="form-label">Interview Date</label>
                  <input class="form-control" type="date" [(ngModel)]="slotForm.slotDate" />
                </div>
                <div class="form-group">
                  <label class="form-label">SmartHire AI In-Platform Meeting Link</label>
                  <input class="form-control" type="text" [(ngModel)]="slotForm.meetingLink" placeholder="http://localhost:4200/meeting-room/..." />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group">
                  <label class="form-label">Slot Start Time (From)</label>
                  <input class="form-control" type="time" [(ngModel)]="slotForm.startTime" />
                </div>
                <div class="form-group">
                  <label class="form-label">Slot End Time (To)</label>
                  <input class="form-control" type="time" [(ngModel)]="slotForm.endTime" />
                </div>
              </div>

              <div style="margin-top: 18px; display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-ghost" (click)="showScheduleFormInsideModal = false">Cancel</button>
                <button class="btn btn-primary" style="background: #8b5cf6; border-color: #8b5cf6;" (click)="confirmScheduleSlot()" [disabled]="scheduleLoading">
                  <span *ngIf="!scheduleLoading">📢 Notify All Shortlisted Candidates</span>
                  <div *ngIf="scheduleLoading" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                </button>
              </div>
            </div>

            <!-- Inline Form for Option 3: Prompt Recruiter for Email Address -->
            <div class="schedule-form-container" *ngIf="showEmailPromptInsideModal">
              <button class="btn btn-ghost btn-sm" style="margin-bottom: 12px;" (click)="showEmailPromptInsideModal = false">
                ← Back to Options
              </button>
              <h4 style="margin: 0 0 8px; color: #38bdf8;">
                ✉️ Send Shortlisted Candidates CSV / Excel File
              </h4>
              <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
                Please enter the email address where you would like the shortlisted candidates report for Job #{{ jobId }} to be delivered:
              </p>

              <div class="form-group">
                <label class="form-label">Recipient Email Address</label>
                <input class="form-control" type="email" [(ngModel)]="customRecipientEmail" placeholder="e.g. recruiter@company.com or hr@company.com" />
              </div>

              <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
                <button class="btn btn-ghost" (click)="showEmailPromptInsideModal = false">Cancel</button>
                <button class="btn btn-primary" style="background: #0284c7; border-color: #0284c7;" (click)="confirmSendEmailToAddress()" [disabled]="emailLoading">
                  <span *ngIf="!emailLoading">Send Shortlisted Candidates CSV ✉️</span>
                  <div *ngIf="emailLoading" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── REAL-TIME CALL CANDIDATE MODAL ── -->
        <div class="modal-overlay" *ngIf="showCallCandidateModal">
          <div class="modal-card fade-in" style="max-width: 540px;">
            <div class="modal-header">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 26px;">🚀</span>
                <div>
                  <h3 style="margin: 0; color: #f8fafc;">Call {{ callingApplicant?.applicantName }} for Live Interview</h3>
                  <p style="margin: 2px 0 0; font-size: 13px; color: #38bdf8;">Candidate will receive urgent 2-minute join notification</p>
                </div>
              </div>
              <button class="close-btn" (click)="closeCallModal()">✕</button>
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">SmartHire AI Live Meeting Room Link</label>
              <input class="form-control" type="text" [(ngModel)]="callMeetingLink" placeholder="http://localhost:4200/meeting-room/..." />
            </div>

            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 13px; color: #fca5a5;">
                ⚡ <b>Urgent Trigger:</b> Clicking send will immediately email <b>{{ callingApplicant?.email }}</b> and trigger a flashing 2-minute join prompt on their dashboard.
              </p>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
              <button class="btn btn-ghost" (click)="closeCallModal()">Cancel</button>
              <button class="btn btn-primary" style="background: #dc2626; border-color: #dc2626;" (click)="confirmCallCandidateLive()" [disabled]="callingLoading">
                <span *ngIf="!callingLoading">Send Live Meet Link & Call 🚨</span>
                <div *ngIf="callingLoading" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
              </button>
            </div>
          </div>
        </div>

        <!-- ── POST-INTERVIEW DECISION MODAL ── -->
        <div class="modal-overlay" *ngIf="showDecisionModal">
          <div class="modal-card fade-in" style="max-width: 500px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 12px;">⚖️</div>
            <h3 style="color: #f8fafc; margin-bottom: 8px;">Post-Interview Decision</h3>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;">
              Interview completed for <b>{{ decisionApplicant?.applicantName }}</b>.<br>
              What is your final hiring decision?
            </p>

            <div style="display: flex; justify-content: center; gap: 16px;">
              <button class="btn btn-primary" style="background: #10b981; border-color: #10b981; padding: 10px 24px; font-size: 14px;"
                (click)="finalSelectCandidate(decisionApplicant?.applicantId)"
                [disabled]="actionLoading[decisionApplicant?.applicantId]">
                🎉 Hire Candidate
              </button>

              <button class="btn btn-danger" style="padding: 10px 24px; font-size: 14px;"
                (click)="finalRejectCandidate(decisionApplicant?.applicantId)"
                [disabled]="actionLoading[decisionApplicant?.applicantId]">
                ✗ Reject Candidate
              </button>
            </div>

            <div style="margin-top: 20px;">
              <button class="btn btn-ghost btn-sm" (click)="closeDecisionModal()">Decide Later</button>
            </div>
          </div>
        </div>

        <!-- ATS Upload Section -->
        <div class="card ats-section" style="margin-bottom:24px">
          <h4 style="margin-bottom:6px">🤖 ATS Bulk Screening</h4>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">
            Upload a resume and job description to calculate AI-powered ATS match score
          </p>
          <div class="ats-inputs">
            <div class="form-group" style="flex:1">
              <label class="form-label">Job Description (for ATS scoring)</label>
              <textarea class="form-control" [(ngModel)]="jdText" rows="3"
                placeholder="Paste job description here for ATS matching..."></textarea>
            </div>
            <div class="ats-upload-side">
              <label class="form-label">Resume (PDF)</label>
              <div class="resume-drop" (click)="resumeInput.click()">
                <input #resumeInput type="file" accept=".pdf" style="display:none" (change)="onResumeSelect($event)">
                <span *ngIf="!atsResume">📂 Upload Resume</span>
                <span *ngIf="atsResume" style="color:var(--teal)">✅ {{ atsResume.name }}</span>
              </div>
              <div class="form-group" style="margin-top:10px">
                <label class="form-label">Applicant ID</label>
                <input class="form-control" type="number" [(ngModel)]="atsApplicantId" placeholder="Applicant ID" />
              </div>
              <button class="btn btn-primary btn-full" style="margin-top:10px" (click)="runAts()" [disabled]="atsLoading">
                <span *ngIf="!atsLoading">Calculate ATS Score</span>
                <div *ngIf="atsLoading" class="spinner" style="width:16px;height:16px;border-width:2px"></div>
              </button>
            </div>
          </div>
          <div class="ats-result card" *ngIf="atsResult" style="margin-top:16px;border-color:rgba(0,229,195,0.3)">
            <div class="ats-score-row">
              <div class="ats-score-val">{{ atsResult.score || atsResult.atsScore || 0 }}%</div>
              <div class="ats-score-info">
                <div class="ats-score-label">ATS Match Score</div>
                <div class="progress" style="width:200px;margin-top:6px">
                  <div class="progress-bar" [style.width]="(atsResult.score || atsResult.atsScore || 0) + '%'"></div>
                </div>
              </div>
            </div>
            <div class="ats-keywords" *ngIf="atsResult.matchedKeywords">
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">Matched Keywords</div>
              <div class="tags">
                <span class="tag" *ngFor="let k of atsResult.matchedKeywords">{{ k }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Applicants Table -->
        <div *ngIf="loading" style="padding:60px;text-align:center"><div class="spinner"></div></div>

        <div *ngIf="!loading && applicants.length === 0" class="empty-state card">
          <div class="empty-state-icon">👥</div>
          <h3>No applicants yet</h3>
          <p>Share the job posting to start receiving applications</p>
        </div>

        <div class="table-wrap" *ngIf="!loading && applicants.length > 0">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Applied</th>
                <th>Round 1 (ATS)</th>
                <th>Round 2 (MCQ)</th>
                <th>Round 3 (Coding)</th>
                <th>Round 4 (Interview Status)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let app of applicants">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="mini-avatar">{{ (app.applicantName || 'A').charAt(0) }}</div>
                    <span>{{ app.applicantName || 'Applicant #' + app.applicantId }}</span>
                  </div>
                </td>
                <td style="color:var(--text-secondary)">{{ app.email || '—' }}</td>
                <td style="color:var(--text-muted);font-size:13px">{{ formatDate(app.appliedAt) }}</td>
                
                <!-- Round 1: ATS -->
                <td>
                  <span class="badge" [ngClass]="getBadgeClass(app.round1_status)">{{ app.round1_status || 'PENDING' }}</span>
                </td>
                
                <!-- Round 2: MCQ -->
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span class="badge" [ngClass]="getBadgeClass(app.round2_status)">{{ app.round2_status || 'PENDING' }}</span>
                    <span *ngIf="app.mcq_score !== null && app.mcq_score !== undefined" style="font-size: 12px; font-weight: 700; color: #10b981;">
                      Score: {{ app.mcq_score }}%
                    </span>
                    <span *ngIf="(app.mcq_score === null || app.mcq_score === undefined) && app.round2_status !== 'SELECTED'" style="font-size: 11px; color: var(--text-muted);">
                      Not Attempted
                    </span>
                  </div>
                </td>

                <!-- Round 3: Coding -->
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span class="badge" [ngClass]="getBadgeClass(app.round3_status)">{{ app.round3_status || 'PENDING' }}</span>
                    <span *ngIf="app.coding_score" style="font-size: 12px; font-weight: 700; color: #38bdf8;">
                      {{ app.coding_score }}
                    </span>
                    <span *ngIf="!app.coding_score && app.round3_status !== 'SELECTED'" style="font-size: 11px; color: var(--text-muted);">
                      Not Attempted
                    </span>
                  </div>
                </td>

                <!-- Round 4: Interview Status -->
                <td>
                  <div style="display: flex; flex-direction: column; gap: 4px;">
                    <span class="badge" [ngClass]="getBadgeClass(app.round4_status)">
                      {{ formatRound4Status(app.round4_status) }}
                    </span>
                    <span *ngIf="app.meeting_link && app.meeting_link !== 'AWAITING_CALL' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED' && app.round4_status !== 'COMPLETED'" style="font-size: 11px; color: #a78bfa;">
                      🔗 <a [href]="app.meeting_link" target="_blank" style="color: #a78bfa; text-decoration: underline;">Active Link</a>
                    </span>
                    <span *ngIf="app.round4_status === 'COMPLETED' || app.round4_status === 'SELECTED' || app.round4_status === 'REJECTED'" style="font-size: 11px; color: var(--text-muted);">
                      🔒 Link Expired
                    </span>
                  </div>
                </td>

                <!-- Action Buttons -->
                <td>
                  <div class="action-btns">
                    <!-- Pass Round 1 (ATS) -->
                    <button class="btn btn-outline btn-sm"
                      *ngIf="app.round1_status !== 'SELECTED' && app.round1_status !== 'REJECTED'"
                      (click)="select(app.applicantId)"
                      [disabled]="actionLoading[app.applicantId]">
                      ✅ Pass R1
                    </button>

                    <!-- Pass Round 2 (MCQ) -> Select for Coding (R3) -->
                    <button class="btn btn-primary btn-sm"
                      style="background: #0284c7; border-color: #0284c7;"
                      *ngIf="app.round1_status === 'SELECTED' && app.round2_status !== 'SELECTED' && app.round2_status !== 'REJECTED'"
                      (click)="selectForRound3(app.applicantId)"
                      [disabled]="actionLoading[app.applicantId]">
                      💻 Pass R2 (To Coding)
                    </button>

                    <!-- Pass Round 3 (Coding) -> Select for Interview (R4) -->
                    <button class="btn btn-primary btn-sm"
                      style="background: #8b5cf6; border-color: #8b5cf6;"
                      *ngIf="app.round2_status === 'SELECTED' && app.round3_status !== 'SELECTED' && app.round3_status !== 'REJECTED'"
                      (click)="selectForRound4(app.applicantId)"
                      [disabled]="actionLoading[app.applicantId]">
                      🎙️ Pass R3 (To Interview)
                    </button>

                    <!-- Round 4: Call Candidate Live (Only when interview not completed) -->
                    <button class="btn btn-primary btn-sm"
                      style="background: linear-gradient(135deg, #ef4444, #dc2626); border: none;"
                      *ngIf="app.round3_status === 'SELECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED' && app.round4_status !== 'COMPLETED'"
                      (click)="openCallModal(app)">
                      🚀 Call Candidate
                    </button>

                    <!-- Round 4: Enter Meeting Room (Only when interview active / not completed) -->
                    <button class="btn btn-primary btn-sm"
                      style="background: #0284c7; border-color: #0284c7;"
                      *ngIf="app.round3_status === 'SELECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED' && app.round4_status !== 'COMPLETED'"
                      (click)="enterMeetingRoom(app)">
                      🎥 Meeting Room
                    </button>

                    <!-- Round 4: Finish & Decide Button (Always available for completed & active interviews until final decision) -->
                    <button class="btn btn-primary btn-sm"
                      style="background: linear-gradient(135deg, #10b981, #059669); border: none;"
                      *ngIf="app.round3_status === 'SELECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED'"
                      (click)="openDecisionModal(app)">
                      ✅ Finish & Decide
                    </button>

                    <!-- Round 4 Interview Options (Only when interview active / not completed) -->
                    <button class="btn btn-outline btn-sm"
                      style="color: #a78bfa; border-color: #8b5cf6;"
                      *ngIf="app.round3_status === 'SELECTED' && app.round4_status !== 'SELECTED' && app.round4_status !== 'REJECTED' && app.round4_status !== 'COMPLETED'"
                      (click)="openRound4OptionsModal(app)">
                      ⚙️ Options
                    </button>

                    <!-- Already Selected Badge -->
                    <span class="badge badge-amber" *ngIf="app.round4_status === 'SELECTED'" style="padding: 6px 12px;">
                      🏆 Hired / Selected
                    </span>

                    <!-- Already Rejected Badge -->
                    <span class="badge badge-red" *ngIf="app.round1_status === 'REJECTED' || app.round2_status === 'REJECTED' || app.round3_status === 'REJECTED' || app.round4_status === 'REJECTED'" style="padding: 6px 12px;">
                      ❌ Rejected
                    </span>

                    <!-- Reject Candidate for earlier rounds only -->
                    <button class="btn btn-danger btn-sm"
                      *ngIf="app.round3_status !== 'SELECTED' && app.round1_status !== 'REJECTED' && app.round2_status !== 'REJECTED' && app.round3_status !== 'REJECTED' && app.round4_status !== 'REJECTED'"
                      (click)="reject(app.applicantId)"
                      [disabled]="actionLoading[app.applicantId]">
                      ✗ Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="alert alert-success" *ngIf="actionMsg" style="margin-top:16px">{{ actionMsg }}</div>
      </div>
    </div>
  `,
  styles: [`
    .page-layout { padding: 32px 40px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-end; margin: 20px 0 24px; }
    .page-header h2 { font-size: 2rem; }
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }

    .ats-section { padding: 24px; }
    .ats-inputs { display: flex; gap: 20px; align-items: flex-start; }
    .ats-upload-side { width: 260px; flex-shrink: 0; }
    .resume-drop {
      border: 2px dashed var(--border); border-radius: var(--radius-sm);
      padding: 14px; text-align: center; cursor: pointer;
      font-size: 13px; color: var(--text-secondary);
      transition: var(--transition);
    }
    .resume-drop:hover { border-color: var(--teal); color: var(--teal); }

    .ats-result { padding: 20px; }
    .ats-score-row { display: flex; align-items: center; gap: 20px; margin-bottom: 16px; }
    .ats-score-val { font-family: var(--font-display); font-size: 3rem; font-weight: 800; color: var(--teal); }
    .ats-score-label { font-size: 13px; color: var(--text-secondary); }

    .mini-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: var(--teal); flex-shrink: 0;
    }
    .action-btns { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }

    /* ── Modal Design ── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(5, 8, 15, 0.85);
      backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 20px;
    }
    .modal-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 12px;
      max-width: 620px; width: 100%; padding: 28px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;
    }
    .close-btn {
      background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;
    }
    .close-btn:hover { color: #fff; }

    .options-grid {
      display: flex; flex-direction: column; gap: 14px; margin-bottom: 10px;
    }
    .option-box {
      background: #0f172a; border: 1px solid #334155; border-radius: 8px;
      padding: 16px; display: flex; align-items: center; gap: 16px;
      cursor: pointer; transition: all 0.2s;
    }
    .option-box:hover {
      border-color: #8b5cf6; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
    }
    .opt-icon {
      width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    .opt-content { flex: 1; }

    .schedule-form-container {
      background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 20px;
    }

    @media(max-width:900px) {
      .stats-row { grid-template-columns: repeat(2,1fr); }
      .ats-inputs { flex-direction: column; }
      .ats-upload-side { width: 100%; }
    }
  `]
})
export class RecruiterApplicantsComponent implements OnInit {
  jobId!: number;
  applicants: any[] = [];
  loading = true;
  actionLoading: any = {};
  actionMsg = '';
  atsResume: File | null = null;
  jdText = '';
  atsApplicantId: number | null = null;
  atsLoading = false;
  atsResult: any = null;

  // Round 4 Options Modal State
  showRound4OptionsModal = false;
  showScheduleFormInsideModal = false;
  showEmailPromptInsideModal = false;
  targetApplicant: any = null;
  selectedCandidateIdForSchedule: number | null = null;
  customRecipientEmail = '';

  // Real-time Candidate Calling Modal State
  showCallCandidateModal = false;
  callingApplicant: any = null;
  callMeetingLink = '';
  callingLoading = false;

  // Decision Modal State
  showDecisionModal = false;
  decisionApplicant: any = null;

  scheduleLoading = false;
  downloadLoading = false;
  emailLoading = false;

  slotForm = {
    slotDate: '',
    startTime: '14:00',
    endTime: '18:00',
    meetingLink: ''
  };

  get selected() { return this.applicants.filter(a => a.round4_status === 'SELECTED').length; }
  get inInterview() { return this.applicants.filter(a => (a.round3_status === 'SELECTED' || a.round4_status === 'IN_INTERVIEW' || a.round4_status === 'SLOT_SCHEDULED') && a.round4_status !== 'SELECTED' && a.round4_status !== 'REJECTED').length; }
  get rejected() { return this.applicants.filter(a => a.round1_status === 'REJECTED' || a.round2_status === 'REJECTED' || a.round3_status === 'REJECTED' || a.round4_status === 'REJECTED').length; }
  get pending() { return this.applicants.filter(a => a.round1_status !== 'SELECTED' && a.round1_status !== 'REJECTED').length; }
  
  get r4EligibleCandidates() {
    return this.applicants.filter(a => a.round3_status === 'SELECTED' && a.round4_status !== 'REJECTED');
  }

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.jobId = Number(this.route.snapshot.paramMap.get('jobId'));
    this.customRecipientEmail = this.auth.currentUser?.email || '';
    this.slotForm.meetingLink = `${window.location.origin}/meeting-room/${this.jobId}`;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.slotForm.slotDate = tomorrow.toISOString().slice(0, 10);

    this.loadApplicants();
  }

  loadApplicants() {
    this.api.getApplicantsForJob(this.jobId).subscribe({
      next: (d) => { 
        this.applicants = (d || []).map((app: any) => {
          let r1 = app.round1_status || 'PENDING';
          let r2 = app.round2_status || 'PENDING';
          let r3 = app.round3_status || 'PENDING';
          let r4 = app.round4_status || 'PENDING';

          const mapped = {
            ...app,
            applicantId: app.applicant_id || app.applicantId || app.id,
            applicantName: app.name || app.applicantName || 'Unknown',
            email: app.email || '',
            appliedAt: app.created_at || app.appliedAt || app.applied_at || new Date().toISOString(),
            round1_status: r1,
            round2_status: r2,
            round3_status: r3,
            round4_status: r4,
            meeting_link: app.meeting_link || null,
            meeting_time: app.meeting_time || null,
            mcq_score: app.mcq_score !== undefined ? app.mcq_score : null,
            coding_score: app.coding_score || null,
            status: r4 === 'SELECTED' ? 'SELECTED' : (r1 || 'APPLIED')
          };
          return mapped;
        });
        this.loading = false;
      },
      error: (err) => { 
        console.error('Error loading applicants:', err);
        this.loading = false; 
      }
    });
  }

  // ── ROUND 4 OPTIONS MODAL CONTROLS ──
  openRound4OptionsModal(app: any = null) {
    this.targetApplicant = app;
    this.showScheduleFormInsideModal = false;
    this.showEmailPromptInsideModal = false;
    this.customRecipientEmail = this.auth.currentUser?.email || '';
    this.showRound4OptionsModal = true;
  }

  closeRound4OptionsModal() {
    this.showRound4OptionsModal = false;
    this.showScheduleFormInsideModal = false;
    this.showEmailPromptInsideModal = false;
    this.targetApplicant = null;
  }

  // Option 1: Schedule Time Slot Window
  chooseScheduleOnPlatform() {
    this.showScheduleFormInsideModal = true;
    this.showEmailPromptInsideModal = false;
  }

  confirmScheduleSlot() {
    if (!this.slotForm.slotDate || !this.slotForm.startTime || !this.slotForm.endTime) {
      alert('Please fill out the interview date and time slot window.');
      return;
    }
    this.scheduleLoading = true;
    this.api.scheduleInterviewSlot({
      jobId: this.jobId,
      slotDate: this.slotForm.slotDate,
      startTime: this.slotForm.startTime,
      endTime: this.slotForm.endTime,
      meetingLink: this.slotForm.meetingLink
    }).subscribe({
      next: (res) => {
        this.applicants.forEach(a => {
          if (a.round3_status === 'SELECTED' && a.round4_status !== 'REJECTED' && a.round4_status !== 'SELECTED') {
            a.round4_status = 'SLOT_SCHEDULED';
          }
        });
        this.actionMsg = `Slot window announced! All candidates emailed to be ready and join within 2 mins of call. 📢`;
        this.scheduleLoading = false;
        this.closeRound4OptionsModal();
        setTimeout(() => this.actionMsg = '', 5000);
      },
      error: (err) => {
        this.actionMsg = `Failed to announce time slot: ${err.error?.message || 'Error'}`;
        this.scheduleLoading = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Option 2: Download Excel Spreadsheet
  downloadApplicantsExcel() {
    this.downloadLoading = true;
    this.api.exportInterviewExcel(this.jobId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Round4_Shortlisted_Applicants_Job_${this.jobId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadLoading = false;
        this.actionMsg = `Excel report downloaded successfully! ✅`;
        this.closeRound4OptionsModal();
        setTimeout(() => this.actionMsg = '', 4000);
      },
      error: (err) => {
        console.warn('Backend excel route failed, using instant client-side CSV download fallback...', err);
        this.fallbackClientDownload();
      }
    });
  }

  private fallbackClientDownload() {
    const headers = ['Applicant ID', 'Candidate Name', 'Email', 'Applied Date', 'R1 (ATS Status)', 'R2 MCQ Score', 'R3 Coding Score', 'R4 Interview Status', 'Meeting Link'];
    const rows = this.applicants.map(a => [
      `"${a.applicantId || a.id}"`,
      `"${a.applicantName || 'Candidate'}"`,
      `"${a.email || ''}"`,
      `"${a.appliedAt || ''}"`,
      `"${a.round1_status || 'PENDING'}"`,
      `"${a.mcq_score !== null ? a.mcq_score + '%' : 'N/A'}"`,
      `"${a.coding_score || 'N/A'}"`,
      `"${a.round4_status || 'PENDING'}"`,
      `"${a.meeting_link || 'Not Set'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Round4_Shortlisted_Applicants_Job_${this.jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.downloadLoading = false;
    this.actionMsg = `Applicants data downloaded successfully! ✅`;
    this.closeRound4OptionsModal();
    setTimeout(() => this.actionMsg = '', 4000);
  }

  // Option 3: Choose Email Option
  chooseEmailOption() {
    this.showEmailPromptInsideModal = true;
    this.showScheduleFormInsideModal = false;
    if (!this.customRecipientEmail) {
      this.customRecipientEmail = this.auth.currentUser?.email || '';
    }
  }

  confirmSendEmailToAddress() {
    if (!this.customRecipientEmail || !this.customRecipientEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    this.emailLoading = true;
    this.api.emailInterviewExcel(this.jobId, this.customRecipientEmail).subscribe({
      next: (res) => {
        this.emailLoading = false;
        this.actionMsg = `Shortlisted candidates CSV dispatched to ${this.customRecipientEmail} successfully! ✉️`;
        this.closeRound4OptionsModal();
        setTimeout(() => this.actionMsg = '', 4500);
      },
      error: (err) => {
        this.emailLoading = false;
        this.actionMsg = `Failed to send email: ${err.error?.message || err.message || 'Error'}`;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // ── CALL CANDIDATE LIVE MODAL CONTROLS ──
  openCallModal(app: any) {
    this.callingApplicant = app;
    this.callMeetingLink = `${window.location.origin}/meeting-room/${this.jobId}/${app.applicantId}`;
    this.showCallCandidateModal = true;
  }

  enterMeetingRoom(app: any) {
    this.router.navigate(['/meeting-room', this.jobId, app.applicantId]);
  }

  closeCallModal() {
    this.showCallCandidateModal = false;
    this.callingApplicant = null;
  }

  confirmCallCandidateLive() {
    if (!this.callMeetingLink) {
      alert('Please provide a meeting link for the interview.');
      return;
    }
    this.callingLoading = true;
    this.api.callCandidateLive({
      jobId: this.jobId,
      applicantId: this.callingApplicant.applicantId,
      meetingLink: this.callMeetingLink
    }).subscribe({
      next: (res) => {
        this.callingApplicant.round4_status = 'IN_INTERVIEW';
        this.callingApplicant.meeting_link = this.callMeetingLink;
        this.callingLoading = false;
        this.closeCallModal();
        this.actionMsg = `🚀 Live meeting link dispatched to ${this.callingApplicant.applicantName}! Candidate alerted to join in 2 mins.`;
        setTimeout(() => this.actionMsg = '', 5500);
      },
      error: (err) => {
        this.callingLoading = false;
        this.actionMsg = `Failed to call candidate: ${err.error?.message || 'Error'}`;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // ── POST-INTERVIEW DECISION MODAL ──
  openDecisionModal(app: any) {
    this.decisionApplicant = app;
    this.showDecisionModal = true;
  }

  closeDecisionModal() {
    this.showDecisionModal = false;
    this.decisionApplicant = null;
  }

  // Final Select / Hire Candidate (Pass Round 4)
  finalSelectCandidate(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.selectRound4Candidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) {
          a.round4_status = 'SELECTED';
          a.status = 'SELECTED';
        }
        this.actionMsg = 'Candidate officially SELECTED & HIRED! 🎉 Offer email sent.';
        this.actionLoading[applicantId] = false;
        this.closeDecisionModal();
        setTimeout(() => this.actionMsg = '', 4500);
      },
      error: (err) => {
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Final Reject Candidate (Round 4)
  finalRejectCandidate(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.rejectRound4Candidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) {
          a.round4_status = 'REJECTED';
          a.status = 'REJECTED';
        }
        this.actionMsg = 'Candidate marked REJECTED.';
        this.actionLoading[applicantId] = false;
        this.closeDecisionModal();
        setTimeout(() => this.actionMsg = '', 4000);
      },
      error: (err) => {
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Pass Round 1 (ATS)
  select(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.selectCandidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) a.round1_status = 'SELECTED';
        this.actionMsg = 'Candidate passed Round 1 (ATS)! Notification sent.';
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 3500);
      },
      error: (err) => { 
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Pass Round 2 (MCQ) -> Select for Coding (Round 3)
  selectForRound3(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.selectRound2Candidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) a.round2_status = 'SELECTED';
        this.actionMsg = 'Candidate passed Round 2! Selected for Round 3 (Coding Assessment).';
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 3500);
      },
      error: (err) => {
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Pass Round 3 (Coding) -> Select for Interview (Round 4)
  selectForRound4(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.selectRound3Candidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) a.round3_status = 'SELECTED';
        this.actionMsg = 'Candidate passed Round 3! Advanced to Round 4 (Interview).';
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 3500);
      },
      error: (err) => {
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  // Reject Candidate
  reject(applicantId: number) {
    this.actionLoading[applicantId] = true;
    this.api.rejectCandidate(this.jobId, applicantId).subscribe({
      next: (res) => {
        const a = this.applicants.find(x => x.applicantId === applicantId);
        if (a) {
          a.round1_status = 'REJECTED';
          a.round2_status = 'REJECTED';
          a.round3_status = 'REJECTED';
          a.round4_status = 'REJECTED';
          a.status = 'REJECTED';
        }
        this.actionMsg = 'Candidate rejected.';
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 3000);
      },
      error: (err) => { 
        this.actionMsg = `Error: ${err.error?.message || 'Failed'}`;
        this.actionLoading[applicantId] = false;
        setTimeout(() => this.actionMsg = '', 5000);
      }
    });
  }

  downloadSelectedCandidatesCsv() {
    const selected = this.applicants.filter(a => a.round4_status === 'SELECTED');
    if (!selected || selected.length === 0) {
      alert('No candidates have been selected/hired yet. Evaluate candidates and click "Finish & Decide" to hire candidates first.');
      return;
    }

    let csv = 'Applicant ID,Candidate Name,Email Address,Applied Date,R1 ATS Status,R2 MCQ Score,R3 Coding Score,R4 Interview Status,Final Selection\n';
    selected.forEach(a => {
      csv += `"${a.applicantId}","${a.applicantName}","${a.email}","${this.formatDate(a.appliedAt)}","SELECTED","${a.mcq_score !== null && a.mcq_score !== undefined ? a.mcq_score + '%' : 'N/A'}","${a.coding_score || 'N/A'}","SELECTED","HIRED (SELECTED)"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Selected_Candidates_Job_${this.jobId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onResumeSelect(event: any) {
    this.atsResume = event.target.files[0] || null;
  }

  runAts() {
    if (!this.atsResume || !this.jdText || !this.atsApplicantId) return;
    this.atsLoading = true; this.atsResult = null;
    this.api.calculateAts(this.atsResume, this.jdText, this.atsApplicantId, this.jobId).subscribe({
      next: (res) => { this.atsResult = res; this.atsLoading = false; },
      error: () => { this.atsLoading = false; }
    });
  }

  manageMcq() { this.router.navigate(['/recruiter/mcq', this.jobId]); }
  manageCoding() { this.router.navigate(['/recruiter/coding', this.jobId]); }
  back() { this.router.navigate(['/recruiter/dashboard']); }

  getBadgeClass(s: string): string {
    const m: any = {
      APPLIED: 'badge-teal',
      SELECTED: 'badge-amber',
      REJECTED: 'badge-red',
      PENDING: 'badge-teal',
      SLOT_SCHEDULED: 'badge-purple',
      IN_INTERVIEW: 'badge-red',
      COMPLETED: 'badge-purple'
    };
    return m[s] || 'badge-teal';
  }

  formatRound4Status(s: string): string {
    if (!s || s === 'PENDING') return 'PENDING';
    if (s === 'SLOT_SCHEDULED') return '⏰ Slot Announced (Ready)';
    if (s === 'IN_INTERVIEW') return '🔴 Live in Interview';
    if (s === 'COMPLETED') return '🔒 Interview Completed (Link Expired)';
    if (s === 'SELECTED') return '🏆 Hired';
    if (s === 'REJECTED') return '❌ Rejected';
    return s;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
