import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: `
    <div class="landing">
      <!-- Top Navigation -->
      <nav class="land-nav">
        <div class="nav-brand">
          <span class="brand-icon">⬡</span>
          <span class="brand-text">SmartHire<span class="brand-ai">AI</span></span>
        </div>
        <div class="nav-ctas">
          <a routerLink="/login" class="btn btn-ghost btn-sm">Sign In</a>
          <a routerLink="/register" class="btn btn-primary btn-sm">Get Started Free</a>
        </div>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-grid-bg"></div>
        <div class="hero-glow"></div>
        <div class="hero-content fade-in">
          <div class="hero-pill">
            <span class="dot"></span> Complete 4-Round AI Recruitment & Proctoring Platform
          </div>
          <h1 class="hero-title">
            Hire Smarter.<br>
            <span class="gradient-text">Not Harder.</span>
          </h1>
          <p class="hero-sub">
            SmartHireAI automates ATS resume screening, MCQ tests, live coding assessments, and HD WebRTC interviews — powered by Gemini AI. Find top talent faster with end-to-end anti-cheat proctoring.
          </p>
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary btn-lg">
              Start Hiring Free
            </a>
            <a routerLink="/jobs" class="btn btn-outline btn-lg">
              Browse Jobs
            </a>
          </div>

          <!-- Hero Highlights / Stats Bar -->
          <div class="hero-stats">
            <div class="h-stat">
              <span class="h-val">Round 1</span>
              <span class="h-lbl">AI Resume ATS</span>
            </div>
            <div class="h-divider"></div>
            <div class="h-stat">
              <span class="h-val">Round 2</span>
              <span class="h-lbl">MCQ Tests</span>
            </div>
            <div class="h-divider"></div>
            <div class="h-stat">
              <span class="h-val">Round 3</span>
              <span class="h-lbl">Coding Assessment</span>
            </div>
            <div class="h-divider"></div>
            <div class="h-stat">
              <span class="h-val">Round 4</span>
              <span class="h-lbl">Live HD Meeting</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Hiring Pipeline Workflow -->
      <section class="pipeline-section">
        <div class="section-label" style="justify-content:center;margin-bottom:12px">End-To-End Recruitment</div>
        <h2 class="pipeline-title">Automated 4-Round Hiring Funnel</h2>
        <div class="pipeline-steps">
          <div class="step-card">
            <div class="step-num">01</div>
            <h3>ATS Resume Screening</h3>
            <p>Gemini AI evaluates candidate resumes against job descriptions, scoring match percentage instantly.</p>
          </div>
          <div class="step-arrow">➔</div>
          <div class="step-card">
            <div class="step-num">02</div>
            <h3>MCQ Assessment</h3>
            <p>Automated technical MCQ rounds with AI question generation and proctored tab monitoring.</p>
          </div>
          <div class="step-arrow">➔</div>
          <div class="step-card">
            <div class="step-num">03</div>
            <h3>Live Coding Test</h3>
            <p>Integrated code editor with automated test case execution, code scoring, and cheat logs.</p>
          </div>
          <div class="step-arrow">➔</div>
          <div class="step-card">
            <div class="step-num">04</div>
            <h3>WebRTC Interview</h3>
            <p>1-on-1 HD video call with bidirectional screen sharing, in-call chat, and recruiter scorecard.</p>
          </div>
        </div>
      </section>

      <!-- Platform Features Grid -->
      <section class="features">
        <div class="section-label" style="justify-content:center;margin-bottom:12px">Platform Features</div>
        <h2 class="features-title">Everything You Need To Source, Evaluate & Hire</h2>
        <div class="features-grid">
          <div class="feature-card" *ngFor="let f of features">
            <div class="feature-header">
              <div class="feature-icon">{{ f.icon }}</div>
              <span class="badge-tag" *ngIf="f.tag">{{ f.tag }}</span>
            </div>
            <h4>{{ f.title }}</h4>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="cta-card">
          <h2>Ready to transform your hiring process?</h2>
          <p>Experience seamless AI screening, proctored coding assessments, and live interviews on SmartHireAI.</p>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:28px">
            <a routerLink="/register" class="btn btn-primary btn-lg">Create Free Account</a>
            <a routerLink="/login" class="btn btn-outline btn-lg">Sign In</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; background: var(--bg-base); color: var(--text-primary); }

    .land-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 60px;
      position: absolute; top: 0; left: 0; right: 0; z-index: 10;
    }
    .nav-brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { color: var(--teal); font-size: 22px; }
    .brand-text { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; }
    .brand-ai { color: var(--teal); }
    .nav-ctas { display: flex; gap: 10px; }

    /* HERO */
    .hero {
      position: relative; overflow: hidden;
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 120px 40px 80px;
    }
    .hero-grid-bg {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(rgba(0,229,195,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,195,0.04) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .hero-glow {
      position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
      width: 600px; height: 400px;
      background: radial-gradient(ellipse, rgba(0,229,195,0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-content {
      position: relative; text-align: center; max-width: 820px;
    }
    .hero-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.25);
      border-radius: 100px; padding: 6px 18px;
      font-size: 12px; font-weight: 600; color: var(--teal);
      letter-spacing: 0.04em; margin-bottom: 28px;
    }
    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--teal);
      box-shadow: 0 0 8px var(--teal);
      animation: pulse 1.8s ease infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .hero-title {
      font-size: clamp(2.8rem, 6vw, 5rem);
      font-weight: 800; line-height: 1.1;
      margin-bottom: 24px;
    }
    .gradient-text {
      background: linear-gradient(135deg, var(--teal), #00a8ff);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-sub {
      font-size: 1.1rem; color: var(--text-secondary);
      max-width: 640px; margin: 0 auto 36px; line-height: 1.7;
    }
    .hero-actions { display: flex; gap: 14px; justify-content: center; margin-bottom: 56px; }
    .hero-stats {
      display: flex; align-items: center; justify-content: center; gap: 24px;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(8px);
      border: 1px solid var(--border); padding: 18px 32px; border-radius: 100px;
      max-width: max-content; margin: 0 auto;
    }
    .h-stat { text-align: center; }
    .h-val { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--teal); display: block; }
    .h-lbl { font-size: 11px; color: var(--text-muted); display: block; margin-top: 2px; }
    .h-divider { width: 1px; height: 32px; background: var(--border); }

    /* PIPELINE WORKFLOW */
    .pipeline-section {
      padding: 80px 40px; text-align: center; border-top: 1px solid var(--border);
      background: rgba(15, 23, 42, 0.3);
    }
    .pipeline-title { font-size: 2.2rem; margin-bottom: 48px; }
    .pipeline-steps {
      display: flex; align-items: center; justify-content: center; gap: 16px;
      max-width: 1200px; margin: 0 auto; flex-wrap: wrap;
    }
    .step-card {
      flex: 1; min-width: 220px; max-width: 260px; background: var(--bg-card);
      border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 24px 20px; text-align: left; position: relative; transition: all 0.2s;
    }
    .step-card:hover { border-color: var(--teal); transform: translateY(-4px); }
    .step-num { font-size: 28px; font-weight: 900; color: var(--teal); opacity: 0.8; margin-bottom: 8px; }
    .step-card h3 { font-size: 1rem; margin-bottom: 8px; }
    .step-card p { font-size: 12px; color: var(--text-secondary); line-height: 1.5; }
    .step-arrow { font-size: 20px; color: var(--teal); opacity: 0.6; }

    /* FEATURES */
    .features {
      padding: 100px 60px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    .features-title { font-size: 2.2rem; margin-bottom: 52px; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px; max-width: 1200px; margin: 0 auto; text-align: left;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 28px; transition: var(--transition);
    }
    .feature-card:hover { border-color: rgba(0,229,195,0.35); transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    .feature-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .feature-icon { font-size: 32px; }
    .badge-tag {
      background: rgba(0,229,195,0.12); color: var(--teal); border: 1px solid rgba(0,229,195,0.3);
      font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; text-transform: uppercase;
    }
    .feature-card h4 { font-size: 1.1rem; margin-bottom: 10px; font-weight: 700; }
    .feature-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

    /* CTA */
    .cta-section { padding: 100px 60px; border-top: 1px solid var(--border); }
    .cta-card {
      background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.2);
      border-radius: var(--radius-xl);
      padding: 64px 40px; text-align: center;
      max-width: 760px; margin: 0 auto;
      box-shadow: var(--shadow-glow);
    }
    .cta-card h2 { font-size: 2.2rem; margin-bottom: 12px; }
    .cta-card p { color: var(--text-secondary); font-size: 1rem; }
  `]
})
export class LandingComponent {
  features = [
    {
      icon: '🤖',
      tag: 'Round 1',
      title: 'AI Resume & ATS Screening',
      desc: 'Gemini AI automatically parses candidate resumes, matching skills & experience against job descriptions with real-time percentage scoring.'
    },
    {
      icon: '📝',
      tag: 'Round 2',
      tagType: 'round',
      title: 'Automated MCQ Assessments',
      desc: 'Generate role-specific MCQ tests dynamically or curate custom question banks with instant automated grading and time limits.'
    },
    {
      icon: '💻',
      tag: 'Round 3',
      title: 'Live Coding Assessment Environment',
      desc: 'Integrated code editor supporting multi-language programming, automated test case execution, submission evaluation, and execution logs.'
    },
    {
      icon: '🎥',
      tag: 'Round 4',
      title: 'HD WebRTC 1-on-1 Interview Meeting Room',
      desc: 'Real-time video/audio calling with bidirectional screen sharing, live candidate-recruiter chat, and dynamic evaluation scorecards.'
    },
    {
      icon: '🛡️',
      tag: 'Proctoring',
      title: 'AI Anti-Cheat & Proctoring Engine',
      desc: 'Continuous anti-cheat monitoring across MCQ, Coding, and Meeting rounds with tab-switch detection, violation counters, and instant recruiter sirens.'
    },
    {
      icon: '📊',
      tag: 'ATS Pipeline',
      title: 'Candidate Tracking & One-Click Hiring',
      desc: 'Kanban & list views for managing multi-round candidate progress. Recruiters can hire or reject applicants with 1-click offer generation.'
    },
    {
      icon: '👥',
      tag: 'Role Management',
      title: 'Dual Recruiter & Applicant Dashboards',
      desc: 'Dedicated interfaces tailored for recruiters to post jobs & review applicants, and job seekers to track applications and take tests.'
    },
    {
      icon: '📧',
      tag: 'Automated Mail',
      title: 'Instant Email & Status Notifications',
      desc: 'Automated system emails for round advancement, test invites, meeting room credentials, password reset, and formal offer letters.'
    }
  ];
}

