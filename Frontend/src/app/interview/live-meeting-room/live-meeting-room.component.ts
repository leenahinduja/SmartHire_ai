import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
  isSelf: boolean;
}

@Component({
  selector: 'app-live-meeting-room',
  template: `
    <div class="meeting-container">
      <!-- Top Meeting Header -->
      <header class="meeting-header">
        <div class="header-left">
          <div class="brand-badge">
            <span class="live-dot"></span>
            SmartHire AI Live Meeting
          </div>
          <span class="room-title">Room #{{ jobId }}-{{ applicantId }}</span>

          <!-- Recruiter Violation Live Badge -->
          <span class="proctor-pill-recruiter" *ngIf="isRecruiter && candidateViolations > 0">
            ⚠️ Candidate Violations: <b>{{ candidateViolations }}</b>
          </span>
        </div>
        <div class="header-right">
          <!-- Candidate Proctoring indicator -->
          <span class="fs-status-pill ok" *ngIf="!isRecruiter && candidateViolations === 0">
            🛡️ Proctoring Active (3 Warnings Allowed)
          </span>
          <span class="fs-status-pill" style="background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444;" *ngIf="!isRecruiter && candidateViolations > 0">
            ⚠️ Warnings: {{ candidateViolations }}/{{ maxViolations }}
          </span>

          <div class="timer-pill">
            ⏱️ {{ formatTimer(meetingSeconds) }}
          </div>
          <span class="user-pill">
            👤 {{ isRecruiter ? 'Recruiter' : 'Candidate' }}: {{ currentUser?.name || currentUser?.email }}
          </span>
        </div>
      </header>

      <!-- Recruiter Realtime Violation Banner Alert -->
      <div class="recruiter-violation-alert" *ngIf="isRecruiter && latestViolationMsg">
        <div class="violation-info">
          <span class="siren">🚨</span>
          <div>
            <b>PROCTORING ALERT:</b> {{ latestViolationMsg }}
          </div>
        </div>
        <div class="violation-actions">
          <button class="btn btn-sm btn-ghost" style="color:#fff;" (click)="dismissRecruiterAlert()">Dismiss</button>
          <button class="btn btn-sm btn-primary" style="background:#f59e0b; border:none;" (click)="sendUnblockSignal()">
            🔓 Unblock Candidate
          </button>
        </div>
      </div>

      <!-- Candidate Warning Overlay Toast -->
      <div class="candidate-warning-toast fade-in" *ngIf="!isRecruiter && candidateWarningMsg">
        <span class="siren">⚠️</span>
        <div>
          <b>INTEGRITY WARNING:</b> {{ candidateWarningMsg }}
          <div style="font-size: 11px; margin-top: 2px;">Tab switching is strictly monitored during Round 4.</div>
        </div>
      </div>

      <!-- Main Stage Area -->
      <div class="stage-container">
        <!-- Video Grid -->
        <div class="video-grid" [class.with-sidebar]="showChat || showScorecard">
          <!-- Remote / Main Video Tile -->
          <div class="video-tile remote-tile">
            <!-- Floating Presenting Screen Banner when local user presents -->
            <div class="presenting-floating-bar" *ngIf="isScreenSharing">
              <div class="presenting-bar-info">
                <span class="presenting-pulse">🖥️</span>
                <span>You are sharing your screen live</span>
              </div>
              <button class="btn btn-sm btn-danger" style="border-radius: 6px; font-weight: 600;" (click)="toggleScreenShare()">
                ⏹️ Stop Presenting
              </button>
            </div>

            <!-- Remote Participant Stream / Remote Screen -->
            <video #remoteVideo autoplay playsinline class="video-stream" [class.hidden]="!hasRemoteStream"></video>
            
            <div class="avatar-placeholder" *ngIf="!hasRemoteStream">
              <div class="pulse-ring"></div>
              <div class="avatar-circle">
                {{ (isRecruiter ? 'Candidate' : 'Recruiter').charAt(0) }}
              </div>
              <div class="waiting-text">
                <h3>{{ isRecruiter ? 'Connecting with Candidate...' : 'Connecting with Recruiter...' }}</h3>
                <p>Establishing peer-to-peer audio & HD video connection. Camera & Mic will connect automatically.</p>
              </div>
            </div>

            <div class="tile-tag" *ngIf="hasRemoteStream">
              <span>🟢 {{ isRemoteScreenSharing ? (isRecruiter ? 'Candidate (Presenting Screen)' : 'Recruiter (Presenting Screen)') : (isRecruiter ? 'Candidate (Live)' : 'Recruiter (Live)') }}</span>
            </div>

            <!-- Violation indicator tag on remote tile for Recruiter -->
            <div class="tile-tag violation-tile-tag" *ngIf="isRecruiter && candidateViolations > 0">
              <span>⚠️ {{ candidateViolations }} Violation(s)</span>
            </div>
          </div>

          <!-- Local Screen Share Preview Tile (Self Screen) -->
          <div class="video-tile screen-preview-tile" *ngIf="isScreenSharing">
            <video #screenPreviewVideo autoplay playsinline muted class="video-stream"></video>
            <div class="tile-tag local-tag">
              <span>🖥️ Your Shared Screen</span>
            </div>
          </div>

          <!-- Local Video Tile (Self) -->
          <div class="video-tile local-tile" [class.cam-off]="!isCameraOn" [class.with-screen-sharing]="isScreenSharing">
            <video #localVideo autoplay playsinline muted class="video-stream" [class.hidden]="!isCameraOn"></video>
            
            <div class="avatar-placeholder local-ph" *ngIf="!isCameraOn">
              <div class="avatar-circle small">
                {{ (currentUser?.name || 'You').charAt(0) }}
              </div>
              <span>Camera Off</span>
            </div>

            <div class="tile-tag local-tag">
              <span>You ({{ isRecruiter ? 'Recruiter' : 'Candidate' }})</span>
              <span *ngIf="!isMicOn" class="muted-tag">🔇 Muted</span>
            </div>
          </div>
        </div>

        <!-- Sidebar 1: Live In-Meeting Chat -->
        <aside class="sidebar-panel fade-in" *ngIf="showChat">
          <div class="sidebar-header">
            <h4>💬 In-Call Messages</h4>
            <button class="close-icon-btn" (click)="showChat = false">✕</button>
          </div>
          <div class="chat-messages" #chatScroll>
            <div *ngIf="chatMessages.length === 0" class="empty-chat">
              <p>No messages yet. Send a message to everyone in the room.</p>
            </div>
            <div *ngFor="let msg of chatMessages" class="chat-bubble" [class.self]="msg.isSelf">
              <div class="msg-meta">
                <b>{{ msg.sender }}</b> • <span>{{ msg.time }}</span>
              </div>
              <div class="msg-text">{{ msg.text }}</div>
            </div>
          </div>
          <div class="chat-input-bar">
            <input type="text" [(ngModel)]="currentMessage" (keyup.enter)="sendMessage()" placeholder="Type a message..." />
            <button class="btn btn-primary btn-sm" (click)="sendMessage()">Send</button>
          </div>
        </aside>

        <!-- Sidebar 2: Evaluation Scorecard & Candidate Notes -->
        <aside class="sidebar-panel fade-in" *ngIf="showScorecard">
          <div class="sidebar-header">
            <h4>{{ isRecruiter ? '📝 Recruiter Scorecard' : '📝 Interview Information & Notes' }}</h4>
            <button class="close-icon-btn" (click)="showScorecard = false">✕</button>
          </div>
          
          <!-- Recruiter View -->
          <div class="scorecard-body" *ngIf="isRecruiter">
            <div class="form-group">
              <label class="form-label">Technical Problem Solving (1-10)</label>
              <input type="range" min="1" max="10" [(ngModel)]="scorecard.techScore" class="form-range" />
              <div class="range-val">{{ scorecard.techScore }}/10</div>
            </div>

            <div class="form-group">
              <label class="form-label">Communication & Professionalism (1-10)</label>
              <input type="range" min="1" max="10" [(ngModel)]="scorecard.commScore" class="form-range" />
              <div class="range-val">{{ scorecard.commScore }}/10</div>
            </div>

            <div class="form-group">
              <label class="form-label">Evaluation Notes / Comments</label>
              <textarea rows="4" [(ngModel)]="scorecard.notes" class="form-control" placeholder="Candidate's strengths, code explanations, areas of concern..."></textarea>
            </div>

            <div class="scorecard-actions">
              <button class="btn btn-primary" style="background:#10b981; border-color:#10b981; flex:1;" (click)="endAndHire()" [disabled]="decisionLoading">
                🎉 Hire Candidate
              </button>
              <button class="btn btn-danger" style="flex:1;" (click)="endAndReject()" [disabled]="decisionLoading">
                ✗ Reject Candidate
              </button>
            </div>
          </div>

          <!-- Candidate View -->
          <div class="scorecard-body" *ngIf="!isRecruiter">
            <div class="info-card-panel" style="background: rgba(15,23,42,0.6); padding: 14px; border-radius: 8px; border: 1px solid #1e293b; font-size: 13px; color: #cbd5e1;">
              <h5 style="color: #38bdf8; margin: 0 0 8px 0; font-size: 14px;">🎯 Round 4 Technical Interview</h5>
              <p style="margin-bottom: 10px; line-height: 1.5;">Welcome to your live meeting session on SmartHireAI.</p>
              <ul style="padding-left: 18px; margin: 0; line-height: 1.6; color: #94a3b8;">
                <li>Keep your microphone and camera active.</li>
                <li>Share your screen anytime using 🖥️ button.</li>
                <li>Send text or links using 💬 chat panel.</li>
              </ul>
            </div>
            
            <div class="form-group" style="margin-top: 14px;">
              <label class="form-label" style="font-size: 12px; color: #94a3b8; font-weight: 600;">Personal Scratchpad / Notes</label>
              <textarea rows="6" [(ngModel)]="candidateNotes" class="form-control" placeholder="Type your notes or code explanations here..." style="width:100%; background:#1e293b; border:1px solid #334155; border-radius:6px; color:#fff; padding:10px; font-size:13px;"></textarea>
            </div>
          </div>
        </aside>
      </div>

      <!-- Bottom Meeting Controls Bar (Google Meet Style) -->
      <footer class="meeting-controls-bar">
        <div class="controls-left">
          <span class="room-code-tag">smart-meet-{{ jobId }}-{{ applicantId }}</span>
        </div>

        <div class="controls-center">
          <!-- Mic Toggle -->
          <button class="ctrl-btn" [class.off]="!isMicOn" (click)="toggleMic()" [title]="isMicOn ? 'Turn off microphone' : 'Turn on microphone'">
            <span *ngIf="isMicOn">🎤</span>
            <span *ngIf="!isMicOn">🔇</span>
          </button>

          <!-- Camera Toggle -->
          <button class="ctrl-btn" [class.off]="!isCameraOn" (click)="toggleCamera()" [title]="isCameraOn ? 'Turn off camera' : 'Turn on camera'">
            <span *ngIf="isCameraOn">📹</span>
            <span *ngIf="!isCameraOn">📷❌</span>
          </button>

          <!-- Screen Share Toggle -->
          <button class="ctrl-btn" [class.active]="isScreenSharing" (click)="toggleScreenShare()" title="Share your screen">
            <span>🖥️</span>
          </button>

          <!-- In-Meeting Chat Toggle -->
          <button class="ctrl-btn" [class.active]="showChat" (click)="toggleChat()" title="In-call messages">
            <span>💬</span>
            <span class="unread-dot" *ngIf="hasUnreadChat"></span>
          </button>

          <!-- Notes & Scorecard Toggle (All 6 Icons Same for Candidate & Recruiter) -->
          <button class="ctrl-btn" [class.active]="showScorecard" (click)="toggleScorecard()" [title]="isRecruiter ? 'Evaluation Scorecard' : 'Interview Information & Notes'">
            <span>📝</span>
          </button>

          <!-- End / Leave Call Button -->
          <button class="ctrl-btn end-call" (click)="leaveMeeting()" title="Leave call">
            <span>📞</span>
          </button>
        </div>

        <div class="controls-right">
          <button class="btn btn-ghost btn-sm" (click)="copyRoomLink()">
            🔗 Copy Link
          </button>
        </div>
      </footer>

      <!-- CANDIDATE FULLSCREEN MANDATE OVERLAY (WITH SPLIT-SCREEN DEMO OPTION) -->
      <div class="fullscreen-blocker-overlay fade-in" *ngIf="!isRecruiter && !isFullscreen && !isBlocked && !dismissedFullscreenPrompt">
        <div class="blocker-card">
          <div class="blocker-icon">🖥️</div>
          <h2>Fullscreen & Split-Screen Mode</h2>
          
          <div>
            <p class="blocker-desc">
              For best experience, conduct Round 4 in <b>Fullscreen Mode</b>.<br>
              Split-screen demo mode is supported for local dual-window testing.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
              <button class="btn btn-primary btn-md" style="background:#0284c7; border:none; padding: 10px 22px; border-radius: 8px; font-weight: 700;" (click)="enterFullscreen()">
                🔒 Enter Fullscreen
              </button>
              <button class="btn btn-ghost btn-md" style="border: 1px solid #334155; padding: 10px 20px; border-radius: 8px; color: #cbd5e1; font-weight: 600;" (click)="dismissFullscreenPrompt()">
                📐 Split-Screen Demo Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CANDIDATE ANTI-CHEAT LOCK OVERLAY (BLOCKED AFTER MAX VIOLATIONS) -->
      <div class="fullscreen-blocker-overlay fade-in" *ngIf="!isRecruiter && isBlocked">
        <div class="blocker-card">
          <div class="blocker-icon">🚫</div>
          <h2>Interview Blocked - Anti-Cheat Violation</h2>
          
          <div>
            <p class="blocker-desc" style="color: #f87171;">
              You have been blocked for multiple tab switches or exiting fullscreen <b>({{ candidateViolations }}/{{ maxViolations }} violations)</b> during the interview.
            </p>
            <p style="font-size: 13px; color: #94a3b8;">
              Your recruiter has received an alert. Please wait for the recruiter to review and unblock your session.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block; width: 100vw; height: 100vh; overflow: hidden;
      background: #0b0f17; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .meeting-container {
      display: flex; flex-direction: column; width: 100%; height: 100vh; position: relative;
    }

    /* Top Header */
    .meeting-header {
      height: 56px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #1e293b; background: #0f172a; flex-shrink: 0;
    }
    .header-left, .header-right { display: flex; align-items: center; gap: 14px; }
    .brand-badge {
      display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px;
      color: #38bdf8; background: rgba(56, 189, 248, 0.1); padding: 4px 12px; border-radius: 100px;
    }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #ef4444; animation: blink 1.4s infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .room-title { font-size: 13px; color: #94a3b8; }
    .timer-pill {
      font-size: 13px; font-weight: 600; color: #facc15; background: rgba(250, 204, 21, 0.1);
      padding: 4px 12px; border-radius: 100px;
    }
    .user-pill { font-size: 13px; color: #cbd5e1; }

    /* Proctoring Pills */
    .proctor-pill-recruiter {
      background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444;
      font-size: 12px; padding: 4px 12px; border-radius: 100px; animation: blink 1.5s infinite;
    }
    .fs-status-pill {
      font-size: 12px; padding: 4px 12px; border-radius: 100px; background: rgba(239, 68, 68, 0.15); color: #f87171;
    }
    .fs-status-pill.ok {
      background: rgba(16, 185, 129, 0.15); color: #34d399;
    }

    /* Alerts */
    .recruiter-violation-alert {
      background: #dc2626; color: #fff; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4); animation: slideDown 0.3s ease;
    }
    .violation-info { display: flex; align-items: center; gap: 10px; font-size: 14px; }
    .violation-actions { display: flex; gap: 8px; }
    .candidate-warning-toast {
      position: absolute; top: 68px; left: 50%; transform: translateX(-50%); z-index: 100;
      background: rgba(239, 68, 68, 0.95); backdrop-filter: blur(8px); color: #fff;
      padding: 12px 24px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      display: flex; align-items: center; gap: 12px; max-width: 600px;
    }
    .siren { font-size: 20px; }

    /* Main Stage */
    .stage-container {
      flex: 1; display: flex; overflow: hidden; padding: 16px; gap: 16px; position: relative;
    }
    .video-grid {
      flex: 1; display: grid; grid-template-columns: 1fr; position: relative; border-radius: 12px; overflow: hidden;
    }
    .video-tile {
      position: relative; background: #1e293b; border-radius: 12px; overflow: hidden;
      display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;
    }
    .video-stream {
      width: 100%; height: 100%; object-fit: contain; background: #000;
    }
    .video-stream.hidden { display: none; }

    /* Local Picture-in-Picture Video */
    .local-tile {
      position: absolute; bottom: 20px; right: 20px; width: 240px; height: 150px;
      border: 2px solid #38bdf8; box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 10;
    }
    .local-tile.cam-off { background: #0f172a; }

    .tile-tag {
      position: absolute; bottom: 12px; left: 12px; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); padding: 4px 10px; border-radius: 6px; font-size: 12px;
      display: flex; align-items: center; gap: 6px; color: #f8fafc;
    }
    .local-tag { bottom: 8px; left: 8px; font-size: 11px; }
    .violation-tile-tag { top: 12px; right: 12px; bottom: auto; left: auto; background: #dc2626; font-weight: 700; }
    .muted-tag { color: #f87171; font-weight: bold; }

    .presenting-floating-bar {
      position: absolute; top: 16px; left: 50%; transform: translateX(-50%); z-index: 25;
      background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(8px); border: 1px solid #0284c7;
      padding: 8px 20px; border-radius: 100px; display: flex; align-items: center; gap: 16px;
      box-shadow: 0 4px 20px rgba(2, 132, 199, 0.3);
    }
    .presenting-bar-info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #38bdf8; }
    .presenting-pulse { font-size: 16px; animation: pulseIcon 1.5s infinite; }
    @keyframes pulseIcon { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }

    .screen-preview-tile {
      position: absolute; bottom: 20px; left: 20px; width: 240px; height: 150px;
      border: 2px solid #0284c7; box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 10; border-radius: 12px; overflow: hidden;
    }

    .avatar-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
      padding: 20px;
    }
    .avatar-circle {
      width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #38bdf8, #8b5cf6);
      display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; color: #fff;
      margin-bottom: 16px;
    }
    .avatar-circle.small { width: 50px; height: 50px; font-size: 20px; margin-bottom: 6px; }
    .waiting-text h3 { margin: 0 0 6px 0; font-size: 18px; color: #f1f5f9; }
    .waiting-text p { margin: 0; font-size: 13px; color: #94a3b8; max-width: 360px; }

    /* Sidebars */
    .sidebar-panel {
      width: 340px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px;
      display: flex; flex-direction: column; overflow: hidden; flex-shrink: 0;
    }
    .sidebar-header {
      padding: 14px 18px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center;
    }
    .sidebar-header h4 { margin: 0; font-size: 15px; color: #f8fafc; }
    .close-icon-btn { background: transparent; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; }

    .chat-messages { flex: 1; padding: 14px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .chat-bubble {
      background: #1e293b; padding: 8px 12px; border-radius: 8px; max-width: 85%; align-self: flex-start;
    }
    .chat-bubble.self { background: #0284c7; align-self: flex-end; }
    .msg-meta { font-size: 10px; color: rgba(255,255,255,0.7); margin-bottom: 3px; }
    .msg-text { font-size: 13px; word-break: break-word; }
    .empty-chat { text-align: center; color: #64748b; font-size: 12px; margin-top: 40px; }

    .chat-input-bar {
      padding: 10px 14px; border-top: 1px solid #1e293b; display: flex; gap: 8px;
    }
    .chat-input-bar input {
      flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; color: #fff; font-size: 13px;
    }

    .scorecard-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 14px; overflow-y: auto; }
    .form-range { width: 100%; accent-color: #38bdf8; }
    .range-val { text-align: right; font-weight: 700; color: #38bdf8; font-size: 13px; }
    .scorecard-actions { display: flex; gap: 10px; margin-top: 10px; }

    /* Bottom Control Bar */
    .meeting-controls-bar {
      height: 72px; padding: 0 24px; background: #0f172a; border-top: 1px solid #1e293b;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .controls-center { display: flex; align-items: center; gap: 12px; }
    .ctrl-btn {
      width: 48px; height: 48px; border-radius: 50%; background: #334155; border: none;
      color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .ctrl-btn:hover { background: #475569; transform: scale(1.05); }
    .ctrl-btn.off { background: #ef4444; }
    .ctrl-btn.active { background: #0284c7; }
    .ctrl-btn.end-call { background: #dc2626; width: 56px; border-radius: 28px; }
    .ctrl-btn.end-call:hover { background: #b91c1c; }
    .unread-dot {
      position: absolute; top: 2px; right: 2px; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; border: 2px solid #0f172a;
    }
    .room-code-tag { font-size: 12px; color: #64748b; font-family: monospace; }

    /* ANTI-CHEAT LOCK OVERLAY */
    .fullscreen-blocker-overlay {
      position: fixed; inset: 0; background: rgba(11, 15, 23, 0.96); backdrop-filter: blur(14px);
      z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px;
    }
    .blocker-card {
      max-width: 540px; background: #0f172a; border: 2px solid #334155; border-radius: 16px;
      padding: 36px 32px; text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,0.6);
    }
    .blocker-icon { font-size: 60px; margin-bottom: 16px; }
    .blocker-card h2 { margin: 0 0 12px 0; font-size: 22px; color: #f8fafc; }
    .blocker-desc { font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 24px; }
  `]
})
export class LiveMeetingRoomComponent implements OnInit, OnDestroy {
  jobId!: number;
  applicantId!: number;
  roomKey = '';
  clientId = '';

  @ViewChild('localVideo') localVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('screenPreviewVideo') screenPreviewRef!: ElementRef<HTMLVideoElement>;

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;
  screenStream: MediaStream | null = null;
  hasRemoteStream = false;

  peerConnection: RTCPeerConnection | null = null;
  signalPollingInterval: any = null;
  lastSignalTimestamp = 0;
  processedSignalIds = new Set<string>();

  isMicOn = true;
  isCameraOn = true;
  isScreenSharing = false;
  isRemoteScreenSharing = false;

  showChat = false;
  showScorecard = false;
  hasUnreadChat = false;

  chatMessages: ChatMessage[] = [];
  currentMessage = '';

  meetingSeconds = 0;
  timerInterval: any = null;

  // ── PROCTORING & ANTI-CHEAT ──
  isFullscreen = false;
  dismissedFullscreenPrompt = false;
  isBlocked = false;
  candidateViolations = 0;
  maxViolations = 3;
  latestViolationMsg = '';
  candidateWarningMsg = '';
  warningTimeout: any = null;

  decisionLoading = false;

  candidateNotes = '';

  scorecard = {
    techScore: 8,
    commScore: 8,
    notes: ''
  };

  get currentUser() { return this.auth.currentUser; }
  get isRecruiter() { return this.auth.isRecruiter; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.jobId = Number(this.route.snapshot.paramMap.get('jobId'));
    this.applicantId = Number(this.route.snapshot.paramMap.get('applicantId'));
    this.roomKey = `${this.jobId}_${this.applicantId}`;
    this.clientId = 'client_' + Math.random().toString(36).substring(2, 9);

    this.startMeetingTimer();
    this.initWebRtcAndMedia();
    this.initProctoringListeners();
  }

  ngOnDestroy() {
    this.cleanupMeeting();
    this.removeProctoringListeners();
  }

  // ── FULLSCREEN & TAB SWITCH PROCTORING CONTROLS ──
  enterFullscreen() {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request error:', e);
    }
    this.isFullscreen = true;
    this.dismissedFullscreenPrompt = true;
  }

  dismissFullscreenPrompt() {
    this.dismissedFullscreenPrompt = true;
    this.isFullscreen = true;
  }

  initProctoringListeners() {
    if (!this.isRecruiter) {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this.onFullscreenChange);
      document.addEventListener('mozfullscreenchange', this.onFullscreenChange);
      document.addEventListener('MSFullscreenChange', this.onFullscreenChange);

      // Check initial state
      this.isFullscreen = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
    }
  }

  removeProctoringListeners() {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.onFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.onFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.onFullscreenChange);
  }

  onFullscreenChange = () => {
    if (this.isRecruiter) return;
    const isFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement);
    if (isFull) {
      this.isFullscreen = true;
    } else if (this.dismissedFullscreenPrompt) {
      // In split screen demo mode, keep room visible
      this.isFullscreen = true;
    } else {
      this.isFullscreen = false;
    }
  };

  onVisibilityChange = () => {
    if (!this.isRecruiter && document.hidden && !this.isBlocked && !this.isScreenSharing) {
      this.recordCandidateViolation('Switched to another browser tab');
    }
  };

  onWindowBlur = () => {
    // Window blur is ignored to support local split-screen testing (Candidate & Recruiter side-by-side)
  };

  recordCandidateViolation(reason: string) {
    this.candidateViolations++;
    this.candidateWarningMsg = `⚠️ Warning ${this.candidateViolations}/${this.maxViolations}: ${reason}! Tab switching is not permitted during interview.`;

    if (this.warningTimeout) clearTimeout(this.warningTimeout);
    this.warningTimeout = setTimeout(() => this.candidateWarningMsg = '', 6000);

    if (this.candidateViolations >= this.maxViolations) {
      this.isBlocked = true;
      this.candidateWarningMsg = `🚫 Limit exceeded (${this.maxViolations}/${this.maxViolations})! Session blocked.`;
    }

    // Signal Recruiter immediately
    this.api.sendSignal(this.roomKey, {
      type: 'PROCTOR_VIOLATION',
      senderId: this.clientId,
      candidateName: this.currentUser?.name || this.currentUser?.email || 'Candidate',
      reason: reason,
      violations: this.candidateViolations,
      timestamp: Date.now()
    }).subscribe();
  }

  dismissRecruiterAlert() {
    this.latestViolationMsg = '';
  }

  sendUnblockSignal() {
    this.latestViolationMsg = '';
    this.api.sendSignal(this.roomKey, {
      type: 'UNBLOCK_CANDIDATE',
      senderId: this.clientId
    }).subscribe({
      next: () => {
        alert('Unblock signal dispatched to candidate.');
      }
    });
  }

  async initWebRtcAndMedia() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      setTimeout(() => {
        if (this.localVideoRef && this.localStream) {
          this.localVideoRef.nativeElement.srcObject = this.localStream;
        }
      }, 200);
    } catch (err) {
      console.warn('Local webcam fallback:', err);
    }

    this.createPeerConnection();
    this.startSignalPolling();

    // Announce Join
    this.api.sendSignal(this.roomKey, {
      type: 'JOIN',
      senderId: this.clientId,
      role: this.isRecruiter ? 'RECRUITER' : 'APPLICANT'
    }).subscribe();
  }

  createPeerConnection() {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(config);

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    }

    this.peerConnection.ontrack = (event) => {
      console.log('Incoming Remote Track received:', event);
      if (event.streams && event.streams.length > 0) {
        this.remoteStream = event.streams[0];
      } else {
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        this.remoteStream.addTrack(event.track);
      }
      this.hasRemoteStream = true;

      setTimeout(() => {
        if (this.remoteVideoRef && this.remoteVideoRef.nativeElement && this.remoteStream) {
          this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
          this.remoteVideoRef.nativeElement.play().catch(() => {});
        }
      }, 50);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.api.sendSignal(this.roomKey, {
          type: 'CANDIDATE',
          senderId: this.clientId,
          candidate: event.candidate.toJSON()
        }).subscribe();
      }
    };
  }

  async sendOffer() {
    if (!this.peerConnection) return;
    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.api.sendSignal(this.roomKey, {
        type: 'OFFER',
        senderId: this.clientId,
        sdp: offer
      }).subscribe();
    } catch (e) {
      console.warn('Send offer notice:', e);
    }
  }

  async startSignalPolling() {
    this.signalPollingInterval = setInterval(() => {
      this.api.getSignals(this.roomKey, this.lastSignalTimestamp).subscribe({
        next: (signals) => {
          if (!signals || signals.length === 0) return;

          for (const s of signals) {
            const ts = s.timestamp || 0;
            if (ts > this.lastSignalTimestamp) {
              this.lastSignalTimestamp = ts;
            }

            const sigId = `${s.type}_${s.senderId}_${ts}`;
            if (this.processedSignalIds.has(sigId)) continue;
            this.processedSignalIds.add(sigId);

            if (s.senderId === this.clientId) continue; // Ignore own messages

            this.handleIncomingSignal(s);
          }
        },
        error: () => {}
      });
    }, 1000);
  }

  async handleIncomingSignal(signal: any) {
    if (signal.type === 'JOIN') {
      if (this.isRecruiter) {
        this.sendOffer();
      }
    } else if (signal.type === 'OFFER' && this.peerConnection) {
      try {
        if (this.peerConnection.signalingState !== 'stable') {
          await Promise.all([
            this.peerConnection.setLocalDescription({ type: 'rollback' } as any),
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          ]);
        } else {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        this.api.sendSignal(this.roomKey, {
          type: 'ANSWER',
          senderId: this.clientId,
          sdp: answer
        }).subscribe();
      } catch (e) {
        console.warn('Error handling offer:', e);
      }
    } else if (signal.type === 'ANSWER' && this.peerConnection) {
      try {
        if (this.peerConnection.signalingState === 'have-local-offer') {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } catch (e) {
        console.warn('Error handling answer:', e);
      }
    } else if (signal.type === 'CANDIDATE' && this.peerConnection) {
      try {
        if (this.peerConnection.remoteDescription) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.warn('Error adding ICE candidate:', e);
      }
    } else if (signal.type === 'SCREEN_START') {
      this.isRemoteScreenSharing = true;
      this.hasRemoteStream = true;
      setTimeout(() => {
        if (this.remoteVideoRef && this.remoteVideoRef.nativeElement && this.remoteStream) {
          this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
          this.remoteVideoRef.nativeElement.play().catch(() => {});
        }
      }, 100);
    } else if (signal.type === 'SCREEN_STOP') {
      this.isRemoteScreenSharing = false;
      setTimeout(() => {
        if (this.remoteVideoRef && this.remoteVideoRef.nativeElement && this.remoteStream) {
          this.remoteVideoRef.nativeElement.srcObject = this.remoteStream;
          this.remoteVideoRef.nativeElement.play().catch(() => {});
        }
      }, 100);
    } else if (signal.type === 'CHAT') {
      this.chatMessages.push({
        sender: signal.sender,
        text: signal.text,
        time: new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSelf: false
      });
      if (!this.showChat) this.hasUnreadChat = true;
    } else if (signal.type === 'PROCTOR_VIOLATION' && this.isRecruiter) {
      this.candidateViolations = signal.violations || (this.candidateViolations + 1);
      this.latestViolationMsg = `${signal.candidateName || 'Candidate'} violation: ${signal.reason} (Total: ${this.candidateViolations})`;
    } else if (signal.type === 'UNBLOCK_CANDIDATE' && !this.isRecruiter) {
      this.isBlocked = false;
      this.candidateViolations = 0;
      this.candidateWarningMsg = 'Recruiter has unblocked your session. Please stay focused on the interview!';
      this.enterFullscreen();
      setTimeout(() => this.candidateWarningMsg = '', 5000);
    }
  }

  toggleMic() {
    this.isMicOn = !this.isMicOn;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(t => t.enabled = this.isMicOn);
    }
  }

  toggleCamera() {
    this.isCameraOn = !this.isCameraOn;
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(t => t.enabled = this.isCameraOn);
    }
  }

  async toggleScreenShare() {
    if (!this.isScreenSharing) {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        const screenTrack = this.screenStream.getVideoTracks()[0];

        if (this.peerConnection) {
          const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          this.stopScreenSharing();
        };

        this.isScreenSharing = true;

        setTimeout(() => {
          if (this.screenPreviewRef && this.screenPreviewRef.nativeElement && this.screenStream) {
            this.screenPreviewRef.nativeElement.srcObject = this.screenStream;
            this.screenPreviewRef.nativeElement.play().catch(() => {});
          }
        }, 100);

        this.api.sendSignal(this.roomKey, {
          type: 'SCREEN_START',
          senderId: this.clientId
        }).subscribe();

      } catch (err) {
        console.warn('Screen share canceled or permission denied:', err);
      }
    } else {
      this.stopScreenSharing();
    }
  }

  stopScreenSharing() {
    this.isScreenSharing = false;

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      const originalVideo = this.localStream.getVideoTracks()[0];
      const sender = this.peerConnection?.getSenders().find(s => s.track?.kind === 'video');
      if (sender && originalVideo) {
        sender.replaceTrack(originalVideo);
        originalVideo.enabled = this.isCameraOn;
      }
    }

    this.api.sendSignal(this.roomKey, {
      type: 'SCREEN_STOP',
      senderId: this.clientId
    }).subscribe();
  }

  toggleChat() {
    this.showChat = !this.showChat;
    if (this.showChat) {
      this.hasUnreadChat = false;
      this.showScorecard = false;
    }
  }

  toggleScorecard() {
    this.showScorecard = !this.showScorecard;
    if (this.showScorecard) {
      this.showChat = false;
    }
  }

  sendMessage() {
    if (!this.currentMessage.trim()) return;

    const senderName = this.currentUser?.name || (this.isRecruiter ? 'Recruiter' : 'Candidate');
    const msgObj: ChatMessage = {
      sender: senderName,
      text: this.currentMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    this.chatMessages.push(msgObj);

    this.api.sendSignal(this.roomKey, {
      type: 'CHAT',
      senderId: this.clientId,
      sender: senderName,
      text: msgObj.text
    }).subscribe();

    this.currentMessage = '';
  }

  copyRoomLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Room meeting link copied to clipboard!');
    });
  }

  startMeetingTimer() {
    this.timerInterval = setInterval(() => {
      this.meetingSeconds++;
    }, 1000);
  }

  formatTimer(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  }

  // Recruiter Decision in Room
  endAndHire() {
    if (!confirm('Are you sure you want to officially HIRE this candidate? A formal offer letter notification will be sent.')) return;
    this.decisionLoading = true;
    this.api.selectRound4Candidate(this.jobId, this.applicantId).subscribe({
      next: () => {
        alert('🎉 Candidate officially Hired! Offer email dispatched.');
        this.decisionLoading = false;
        this.leaveMeeting();
      },
      error: () => {
        this.decisionLoading = false;
        this.leaveMeeting();
      }
    });
  }

  endAndReject() {
    if (!confirm('Are you sure you want to mark this candidate as REJECTED?')) return;
    this.decisionLoading = true;
    this.api.rejectRound4Candidate(this.jobId, this.applicantId).subscribe({
      next: () => {
        alert('Candidate marked as Rejected.');
        this.decisionLoading = false;
        this.leaveMeeting();
      },
      error: () => {
        this.decisionLoading = false;
        this.leaveMeeting();
      }
    });
  }

  leaveMeeting() {
    this.cleanupMeeting();
    if (this.isRecruiter) {
      this.router.navigate(['/recruiter/applicants', this.jobId]);
    } else {
      this.router.navigate(['/my-applications']);
    }
  }

  cleanupMeeting() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.signalPollingInterval) clearInterval(this.signalPollingInterval);
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
  }
}
