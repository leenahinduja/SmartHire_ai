import { Component } from '@angular/core';

@Component({
  selector: 'app-landing',
  template: `
    <div class="landing">
      <!-- Hero -->
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

      <section class="hero">
        <div class="hero-grid-bg"></div>
        <div class="hero-glow"></div>
        <div class="hero-content fade-in">
          <div class="hero-pill">
            <span class="dot"></span> AI-Powered Recruitment Platform
          </div>
          <h1 class="hero-title">
            Hire Smarter.<br>
            <span class="gradient-text">Not Harder.</span>
          </h1>
          <p class="hero-sub">
            SmartHireAI automates ATS screening, MCQ assessment rounds,
            and candidate tracking — powered by Gemini AI. Find the right
            talent, faster.
          </p>
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary btn-lg">
              Start Hiring Free
            </a>
            <a routerLink="/jobs" class="btn btn-outline btn-lg">
              Browse Jobs
            </a>
          </div>
          <div class="hero-stats">
            <div class="h-stat">
              <span class="h-val">AI</span>
              <span class="h-lbl">ATS Scoring</span>
            </div>
            <div class="h-divider"></div>
            <div class="h-stat">
              <span class="h-val">MCQ</span>
              <span class="h-lbl">Auto Assessments</span>
            </div>
            <div class="h-divider"></div>
            <div class="h-stat">
              <span class="h-val">2x</span>
              <span class="h-lbl">Faster Hiring</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="features">
        <div class="section-label" style="justify-content:center;margin-bottom:12px">Platform Features</div>
        <h2 class="features-title">Everything you need to hire right</h2>
        <div class="features-grid">
          <div class="feature-card" *ngFor="let f of features">
            <div class="feature-icon">{{ f.icon }}</div>
            <h4>{{ f.title }}</h4>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta-section">
        <div class="cta-card">
          <h2>Ready to transform your hiring?</h2>
          <p>Join companies using SmartHireAI for smarter recruitment</p>
          <div style="display:flex;gap:12px;justify-content:center;margin-top:28px">
            <a routerLink="/register" class="btn btn-primary btn-lg">Create Account</a>
            <a routerLink="/login" class="btn btn-outline btn-lg">Sign In</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing { min-height: 100vh; background: var(--bg-base); }

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
      position: relative; text-align: center; max-width: 760px;
    }
    .hero-pill {
      display: inline-flex; align-items: center; gap: 8px;
      background: var(--teal-glow); border: 1px solid rgba(0,229,195,0.25);
      border-radius: 100px; padding: 6px 16px;
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
      max-width: 540px; margin: 0 auto 36px; line-height: 1.7;
    }
    .hero-actions { display: flex; gap: 14px; justify-content: center; margin-bottom: 56px; }
    .hero-stats { display: flex; align-items: center; justify-content: center; gap: 32px; }
    .h-stat { text-align: center; }
    .h-val { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--teal); display: block; }
    .h-lbl { font-size: 12px; color: var(--text-muted); display: block; margin-top: 2px; }
    .h-divider { width: 1px; height: 40px; background: var(--border); }

    /* FEATURES */
    .features {
      padding: 100px 60px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    .features-title { font-size: 2.2rem; margin-bottom: 52px; }
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px; max-width: 1100px; margin: 0 auto; text-align: left;
    }
    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 28px; transition: var(--transition);
    }
    .feature-card:hover { border-color: rgba(0,229,195,0.25); transform: translateY(-2px); }
    .feature-icon { font-size: 28px; margin-bottom: 14px; }
    .feature-card h4 { font-size: 1rem; margin-bottom: 8px; }
    .feature-card p { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

    /* CTA */
    .cta-section { padding: 100px 60px; border-top: 1px solid var(--border); }
    .cta-card {
      background: linear-gradient(135deg, var(--bg-card), var(--bg-elevated));
      border: 1px solid rgba(0,229,195,0.2);
      border-radius: var(--radius-xl);
      padding: 64px 40px; text-align: center;
      max-width: 700px; margin: 0 auto;
      box-shadow: var(--shadow-glow);
    }
    .cta-card h2 { font-size: 2.2rem; margin-bottom: 12px; }
    .cta-card p { color: var(--text-secondary); font-size: 1rem; }
  `]
})
export class LandingComponent {
  features = [
    { icon: '🤖', title: 'AI Resume Scoring', desc: 'Gemini AI parses resumes and scores them against job descriptions using advanced NLP.' },
    { icon: '📋', title: 'MCQ Assessments', desc: 'Auto-generate or manually create MCQ tests. Release to shortlisted candidates instantly.' },
    { icon: '🎯', title: 'ATS Pipeline', desc: 'Automated Applicant Tracking System with multi-round screening and real-time status.' },
    { icon: '👥', title: 'Dual Role System', desc: 'Separate interfaces for Recruiters and Applicants with role-based access control.' },
    { icon: '📧', title: 'Email Notifications', desc: 'Automated emails for application status, MCQ invites, and password resets.' },
    { icon: '🔍', title: 'Smart Job Search', desc: 'Filter jobs by keyword and location. Apply in one click with your saved profile.' },
  ];
}
