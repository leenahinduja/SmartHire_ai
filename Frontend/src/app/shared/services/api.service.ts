import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Use relative base so the Angular dev server proxy (`proxy.conf.json`) is used
  // which forwards cookies and avoids CORS during local development.
  readonly BASE = '';
  private options = { withCredentials: true };
  constructor(private http: HttpClient) {}

  getAllJobs(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/job/all`, this.options);
  }
  getJobById(id: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/job/${id}`, this.options);
  }
  createJob(job: any): Observable<any> {
    return this.http.post(`${this.BASE}/job/savejobdetails`, job, this.options);
  }
  updateJob(id: number, job: any): Observable<any> {
    return this.http.put(`${this.BASE}/job/update/${id}`, job, this.options);
  }
  deleteJob(id: number): Observable<any> {
    return this.http.patch(`${this.BASE}/job/delete/${id}`, {}, this.options);
  }
  searchJobs(keyword: string, location: string): Observable<any[]> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    if (location) params = params.set('location', location);
    return this.http.get<any[]>(`${this.BASE}/job/search`, { params, ...this.options });
  }

  // ── APPLICATIONS ──────────────────────────────
  applyJob(jobId: number): Observable<any> {
    return this.http.post(`${this.BASE}/applications/apply/${jobId}`, {}, this.options);
  }
  getMyApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/applications/my`, this.options);
  }
  getApplicantsForJob(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/applications/job/${jobId}`, this.options);
  }
  getApplicationStatus(jobId: number): Observable<any> {
    return this.http.get(`${this.BASE}/applications/status/${jobId}`, this.options);
  }

  // ── APPLICANT PROFILE ─────────────────────────
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.BASE}/applicant/profile`, this.options);
  }
  saveProfile(profile: any): Observable<any> {
    return this.http.post(`${this.BASE}/applicant/profile`, profile, this.options);
  }
  updateProfile(profile: any): Observable<any> {
    return this.http.put(`${this.BASE}/applicant/profile`, profile, this.options);
  }
  uploadResume(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.BASE}/applicant/upload-resume`, fd, this.options);
  }

  // ── ATS ───────────────────────────────────────
  calculateAts(resume: File, jobDescription: string, applicantId: number, jobId: number): Observable<any> {
    const fd = new FormData();
    fd.append('resume', resume);
    fd.append('jobDescription', jobDescription);
    fd.append('applicantId', applicantId.toString());
    fd.append('jobId', jobId.toString());
    return this.http.post(`${this.BASE}/ats/calculate`, fd, this.options);
  }

  // ── ROUND 1 ───────────────────────────────────
  selectCandidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round1/select`, { jobId, applicantId }, this.options);
  }
  rejectCandidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round1/reject`, { jobId, applicantId }, this.options);
  }

  // ── MCQ ───────────────────────────────────────
  createMcqTest(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/round2/mcq/create`, payload, this.options);
  }
  saveMcqQuestionsBatch(questions: any[]): Observable<any> {
    return this.http.post(`${this.BASE}/round2/mcq/question/create-batch`, questions, this.options);
  }
  releaseMcqTest(jobId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round2/mcq/release/${jobId}`, {}, this.options);
  }
  startMcqTest(jobId: number): Observable<any> {
    return this.http.get(`${this.BASE}/round2/mcq/start/${jobId}`, this.options);
  }
  generateAiQuestions(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/round2/mcq/question/generate-ai`, payload, this.options);
  }

  // ── ROUND 2 TEST ─────────────────────────────
  startRound2Test(testId: number): Observable<number> {
    return this.http.post<number>(`${this.BASE}/round2/start`, { testId }, this.options);
  }
  getRound2Questions(testId: number): Observable<any> {
    return this.http.get<any>(`${this.BASE}/round2/questions/${testId}`, this.options);
  }
  logRound2Violation(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/round2/proctor/log`, payload, this.options);
  }
  submitRound2Test(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/round2/submit`, payload, this.options);
  }
  selectRound2Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round2/select`, { jobId, applicantId }, this.options);
  }
  rejectRound2Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round2/reject`, { jobId, applicantId }, this.options);
  }

  // ── ROUND 3 CODING ASSESSMENT (LeetCode Engine) ─
  getCodingAssessment(jobId: number): Observable<any> {
    return this.http.get(`${this.BASE}/coding/assessment/${jobId}`, this.options);
  }
  getCodingProblem(problemId: number): Observable<any> {
    return this.http.get(`${this.BASE}/coding/problem/${problemId}`, this.options);
  }
  runCode(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/coding/run`, payload, this.options);
  }
  submitCoding(payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/coding/submit`, payload, this.options);
  }
  createCodingProblem(problem: any): Observable<any> {
    return this.http.post(`${this.BASE}/coding/problem`, problem, this.options);
  }
  addCodingTestCase(testCase: any): Observable<any> {
    return this.http.post(`${this.BASE}/coding/testcase`, testCase, this.options);
  }
  getCodingSubmissions(problemId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/coding/submissions/${problemId}`, this.options);
  }
  getCodingProblemsByJob(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/coding/job/${jobId}`, this.options);
  }
  getJobCodingSubmissions(jobId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/coding/recruiter/submissions/${jobId}`, this.options);
  }

  // ── ROUND 3 SELECTION ─────────────────────────
  selectRound3Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round3/select`, { jobId, applicantId }, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/round3/select`, { jobId, applicantId }, this.options))
    );
  }
  rejectRound3Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/round3/reject`, { jobId, applicantId }, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/round3/reject`, { jobId, applicantId }, this.options))
    );
  }

  // ── ROUND 4 (INTERVIEW & FINAL SELECTION) ──────
  scheduleInterview(payload: { jobId: number; applicantId: number; meetingLink: string; meetingTime: string }): Observable<any> {
    return this.http.post(`${this.BASE}/interview/schedule`, payload, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/schedule`, payload, this.options))
    );
  }
  getInterviewMeeting(jobId: number): Observable<any> {
    return this.http.get(`${this.BASE}/interview/meeting/${jobId}`, this.options).pipe(
      catchError(() => this.http.get(`http://localhost:8082/interview/meeting/${jobId}`, this.options))
    );
  }
  selectRound4Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/interview/select`, { jobId, applicantId }, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/select`, { jobId, applicantId }, this.options))
    );
  }
  rejectRound4Candidate(jobId: number, applicantId: number): Observable<any> {
    return this.http.post(`${this.BASE}/interview/reject`, { jobId, applicantId }, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/reject`, { jobId, applicantId }, this.options))
    );
  }
  scheduleInterviewSlot(payload: { jobId: number; slotDate: string; startTime: string; endTime: string; meetingLink?: string }): Observable<any> {
    return this.http.post(`${this.BASE}/interview/schedule-slot`, payload, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/schedule-slot`, payload, this.options))
    );
  }
  callCandidateLive(payload: { jobId: number; applicantId: number; meetingLink: string }): Observable<any> {
    return this.http.post(`${this.BASE}/interview/call-candidate`, payload, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/call-candidate`, payload, this.options))
    );
  }
  exportInterviewExcel(jobId: number): Observable<Blob> {
    return this.http.get(`${this.BASE}/interview/export-excel/${jobId}`, { ...this.options, responseType: 'blob' }).pipe(
      catchError(() => this.http.get(`http://localhost:8082/interview/export-excel/${jobId}`, { ...this.options, responseType: 'blob' }))
    );
  }
  emailInterviewExcel(jobId: number, email?: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/email-excel/${jobId}`, { email }, this.options).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/email-excel/${jobId}`, { email }, this.options))
    );
  }

  // ── WEBRTC SIGNALING ──────────────────────────
  sendSignal(roomKey: string, payload: any): Observable<any> {
    return this.http.post(`${this.BASE}/interview/signal/${roomKey}`, payload).pipe(
      catchError(() => this.http.post(`http://localhost:8082/interview/signal/${roomKey}`, payload))
    );
  }
  getSignals(roomKey: string, since: number = 0): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE}/interview/signal/${roomKey}?since=${since}`).pipe(
      catchError(() => this.http.get<any[]>(`http://localhost:8082/interview/signal/${roomKey}?since=${since}`))
    );
  }
}
