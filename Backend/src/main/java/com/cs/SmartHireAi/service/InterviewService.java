package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.InterviewMeeting;
import com.cs.SmartHireAi.model.ScheduleInterviewRequest;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.ApplicationRepository;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.InterviewRepository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final AuthRepository authRepository;
    private final JobsPostingRepository jobsPostingRepository;
    private final EmailService emailService;

    public void scheduleInterview(ScheduleInterviewRequest request) {
        LocalDateTime meetingTime = null;
        if (request.getMeetingTime() != null && !request.getMeetingTime().isBlank()) {
            try {
                meetingTime = LocalDateTime.parse(request.getMeetingTime());
            } catch (Exception e) {
                meetingTime = LocalDateTime.now().plusDays(2);
            }
        } else {
            meetingTime = LocalDateTime.now().plusDays(2);
        }

        interviewRepository.saveOrUpdateMeeting(
                request.getJobId(),
                request.getApplicantId(),
                request.getMeetingLink(),
                meetingTime
        );

        User user = authRepository.findById(request.getApplicantId());
        String jobTitle = (jobsPostingRepository.getJobById(request.getJobId()) != null)
                ? jobsPostingRepository.getJobById(request.getJobId()).getTitle()
                : "Open Position";

        if (user != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEEE, MMMM dd, yyyy 'at' hh:mm a");
            String formattedDate = meetingTime.format(formatter);

            String subject = "Interview Scheduled for " + jobTitle + " – SmartHire AI";
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #008080;">Round 4: Technical & HR Interview Scheduled!</h2>
                    <p>Dear <b>%s</b>,</p>
                    <p>Congratulations on clearing the technical coding assessment for the role of <b>%s</b>.</p>
                    <p>Your interview has been scheduled with the hiring team:</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #008080; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;">📅 <b>Date & Time:</b> %s</p>
                        <p style="margin: 0;">🔗 <b>Meeting Link:</b> <a href="%s" target="_blank" style="color: #0284c7; font-weight: bold;">%s</a></p>
                    </div>

                    <p>Please make sure you join 5 minutes before the scheduled time with a stable internet connection and webcam turned on.</p>
                    <div style="margin: 25px 0; text-align: center;">
                        <a href="%s" target="_blank" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join Interview Meeting</a>
                    </div>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle, formattedDate, request.getMeetingLink(), request.getMeetingLink(), request.getMeetingLink());

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    // ── 1. NOTIFY CANDIDATES ABOUT TIME SLOT WINDOW ──
    public void scheduleTimeSlotWindow(com.cs.SmartHireAi.model.ScheduleSlotRequest request) {
        String jobTitle = (jobsPostingRepository.getJobById(request.getJobId()) != null)
                ? jobsPostingRepository.getJobById(request.getJobId()).getTitle()
                : "Open Position";

        java.util.List<java.util.Map<String, Object>> applicants = applicationRepository.getByJob(request.getJobId());

        for (java.util.Map<String, Object> a : applicants) {
            String r3 = (String) a.get("round3_status");
            String r4 = (String) a.get("round4_status");

            if ("SELECTED".equalsIgnoreCase(r3) && !"REJECTED".equalsIgnoreCase(r4)) {
                Long applicantId = ((Number) (a.get("applicant_id") != null ? a.get("applicant_id") : a.get("id"))).longValue();
                String email = (String) a.get("email");
                String name = (String) (a.get("name") != null ? a.get("name") : "Candidate");

                // Save placeholder or initial meeting entry
                interviewRepository.saveOrUpdateMeeting(
                        request.getJobId(),
                        applicantId,
                        request.getMeetingLink() != null ? request.getMeetingLink() : "AWAITING_CALL",
                        LocalDateTime.now().plusDays(1)
                );
                try {
                    interviewRepository.updateRound4Status(request.getJobId(), applicantId, "SLOT_SCHEDULED");
                } catch (Exception ex) {
                    // Fallback in case round4_status column is ENUM('PENDING','SELECTED','REJECTED')
                    try {
                        interviewRepository.updateRound4Status(request.getJobId(), applicantId, "PENDING");
                    } catch (Exception ignored) {}
                }

                if (email != null && !email.isBlank()) {
                    String subject = "📅 Round 4 Interview Slot Scheduled: " + request.getSlotDate() + " (" + request.getStartTime() + " - " + request.getEndTime() + ") – " + jobTitle;
                    String body = String.format("""
                        <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 22px; border: 2px solid #8b5cf6; border-radius: 10px;">
                            <h2 style="color: #7c3aed; margin-top: 0;">Round 4: Interview Slot Confirmed!</h2>
                            <p>Dear <b>%s</b>,</p>
                            <p>Congratulations on advancing to <b>Round 4 (Technical & HR Interview)</b> for the role of <b>%s</b>.</p>
                            
                            <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-left: 4px solid #7c3aed; padding: 16px; margin: 18px 0; border-radius: 6px;">
                                <p style="margin: 0 0 8px 0; font-size: 15px;">📅 <b>Interview Date:</b> %s</p>
                                <p style="margin: 0; font-size: 15px;">⏰ <b>Active Time Window:</b> %s to %s</p>
                            </div>

                            <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 14px; margin: 18px 0; border-radius: 6px; font-size: 14px;">
                                <b style="color: #b45309;">⚠️ Critical Interview Process Instructions:</b>
                                <ul style="margin: 8px 0 0 16px; padding: 0; color: #92400e;">
                                    <li>Interviews are conducted turn-by-turn in real time.</li>
                                    <li>Please keep your registered email and SmartHire AI dashboard active during the scheduled window.</li>
                                    <li>When your turn arrives, your interviewer will generate and send your <b>Live Meeting Link</b>.</li>
                                    <li><b>You must join the meeting within 2 minutes of receiving the live link notification.</b></li>
                                </ul>
                            </div>

                            <p style="font-size: 13px; color: #6b7280;">Stay prepared with your camera and microphone enabled.</p>
                            <br>
                            <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                        </div>
                        """, name, jobTitle, request.getSlotDate(), request.getStartTime(), request.getEndTime());

                    emailService.sendNotificationEmail(email, subject, body);
                }
            }
        }
    }

    // ── 2. CALL SPECIFIC CANDIDATE LIVE (SEND INSTANT MEETING LINK) ──
    public void callCandidateLive(com.cs.SmartHireAi.model.CallCandidateRequest request) {
        interviewRepository.saveOrUpdateMeeting(
                request.getJobId(),
                request.getApplicantId(),
                request.getMeetingLink(),
                LocalDateTime.now()
        );
        try {
            interviewRepository.updateRound4Status(request.getJobId(), request.getApplicantId(), "IN_INTERVIEW");
        } catch (Exception ex) {
            try {
                interviewRepository.updateRound4Status(request.getJobId(), request.getApplicantId(), "PENDING");
            } catch (Exception ignored) {}
        }

        User user = authRepository.findById(request.getApplicantId());
        String jobTitle = (jobsPostingRepository.getJobById(request.getJobId()) != null)
                ? jobsPostingRepository.getJobById(request.getJobId()).getTitle()
                : "Open Position";

        if (user != null) {
            String subject = "🚨 URGENT: Your Interview is Starting NOW! – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 24px; border: 2px solid #ef4444; border-radius: 12px; background: #fff;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #dc2626; margin: 0;">🚨 Your Interview is Starting NOW! 🚨</h2>
                        <p style="color: #b91c1c; font-weight: bold; font-size: 15px; margin-top: 6px;">Your interviewer is ready and waiting for you.</p>
                    </div>

                    <p>Dear <b>%s</b>,</p>
                    <p>Your Round 4 interview for the position of <b>%s</b> is commencing immediately.</p>
                    
                    <div style="background-color: #fef2f2; border: 2px dashed #ef4444; padding: 18px; margin: 22px 0; border-radius: 8px; text-align: center;">
                        <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: bold; color: #991b1b;">⏰ ACTION REQUIRED: Please join within 2 minutes!</p>
                        <a href="%s" target="_blank" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);">
                            🚀 JOIN LIVE INTERVIEW NOW →
                        </a>
                        <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">Direct Link: <a href="%s" target="_blank">%s</a></p>
                    </div>

                    <p style="font-size: 13px; color: #4b5563;">Ensure your camera, microphone, and quiet room setup are ready.</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle, request.getMeetingLink(), request.getMeetingLink(), request.getMeetingLink());

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public InterviewMeeting getMeeting(Long jobId, Long applicantId) {
        return interviewRepository.findByJobAndApplicant(jobId, applicantId);
    }

    public void selectCandidate(Long jobId, Long applicantId) {
        interviewRepository.updateRound4Status(jobId, applicantId, "SELECTED");

        User user = authRepository.findById(applicantId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null)
                ? jobsPostingRepository.getJobById(jobId).getTitle()
                : "Open Position";

        if (user != null) {
            String subject = "🎉 Congratulations! You are Selected for " + jobTitle + "!";
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 25px; border: 2px solid #008080; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #008080; margin: 0;">🎉 Congratulations %s! 🎉</h1>
                        <p style="font-size: 16px; color: #16a34a; font-weight: bold; margin-top: 5px;">You have officially cleared all rounds and have been SELECTED!</p>
                    </div>
                    <p>Dear <b>%s</b>,</p>
                    <p>We are delighted to offer you the position of <b>%s</b> at our company through SmartHire AI.</p>
                    <p>You have demonstrated outstanding skills across our AI resume screening, MCQ technical evaluation, live code assessment, and technical interview rounds.</p>
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 8px; margin: 25px 0; text-align: center;">
                        <h3 style="margin: 0 0 8px 0; color: #15803d;">Status: Final Selection Approved ✅</h3>
                        <p style="margin: 0; color: #166534; font-size: 14px;">Our HR department will reach out to you with the formal offer letter and onboarding details shortly.</p>
                    </div>
                    <div style="text-align: center; margin: 25px 0;">
                        <a href="http://localhost:4200/my-applications" style="background: linear-gradient(135deg, #008080, #00a86b); color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Application Status</a>
                    </div>
                    <p>Welcome aboard, and congratulations once again!</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment & HR Team</b></p>
                </div>
                """, user.getName(), user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public void rejectCandidate(Long jobId, Long applicantId) {
        interviewRepository.updateRound4Status(jobId, applicantId, "REJECTED");

        User user = authRepository.findById(applicantId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null)
                ? jobsPostingRepository.getJobById(jobId).getTitle()
                : "Open Position";

        if (user != null) {
            String subject = "Application Status Update – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2>Hello %s,</h2>
                    <p>Thank you for taking the time to interview with us for the <b>%s</b> role.</p>
                    <p>While we were impressed with your technical capabilities, we have decided to move forward with other candidates who more closely align with our current requirements.</p>
                    <p>We sincerely appreciate your effort and wish you the best in your career search.</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public byte[] generateRound4ExcelReport(Long jobId) {
        java.util.List<java.util.Map<String, Object>> applicants = applicationRepository.getByJob(jobId);

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Round 4 Candidates");

            // Header Row
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
            String[] columns = {"Applicant ID", "Candidate Name", "Email Address", "Applied Date", "R1 (ATS Status)", "R2 MCQ Score", "R3 Coding Score", "R4 Interview Status", "Meeting Link", "Meeting Time"};
            for (int i = 0; i < columns.length; i++) {
                header.createCell(i).setCellValue(columns[i]);
            }

            int rowIdx = 1;
            for (java.util.Map<String, Object> a : applicants) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(String.valueOf(a.get("applicant_id") != null ? a.get("applicant_id") : a.get("id")));
                row.createCell(1).setCellValue(String.valueOf(a.get("name") != null ? a.get("name") : "Candidate"));
                row.createCell(2).setCellValue(String.valueOf(a.get("email") != null ? a.get("email") : ""));
                row.createCell(3).setCellValue(String.valueOf(a.get("applied_at") != null ? a.get("applied_at") : ""));
                row.createCell(4).setCellValue(String.valueOf(a.get("round1_status") != null ? a.get("round1_status") : "PENDING"));
                row.createCell(5).setCellValue(a.get("mcq_score") != null ? a.get("mcq_score") + "%" : "Not Attempted");
                row.createCell(6).setCellValue(String.valueOf(a.get("coding_score") != null ? a.get("coding_score") : "Not Attempted"));
                row.createCell(7).setCellValue(String.valueOf(a.get("round4_status") != null ? a.get("round4_status") : "PENDING"));
                row.createCell(8).setCellValue(String.valueOf(a.get("meeting_link") != null ? a.get("meeting_link") : "Not Set"));
                row.createCell(9).setCellValue(String.valueOf(a.get("meeting_time") != null ? a.get("meeting_time") : "Not Set"));
            }

            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report: " + e.getMessage(), e);
        }
    }

    public void emailRound4ExcelReport(Long jobId, String recruiterEmail) {
        byte[] excelBytes = generateRound4ExcelReport(jobId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null) ? jobsPostingRepository.getJobById(jobId).getTitle() : ("Job #" + jobId);
        String filename = "Round4_Shortlisted_Applicants_Job_" + jobId + ".xlsx";

        String subject = "📊 Round 4 Shortlisted Candidates Excel Report – " + jobTitle;
        String body = String.format("""
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #008080;">Round 4 Shortlisted Applicants Excel Report</h2>
                <p>Hello,</p>
                <p>As requested, please find attached the official Excel spreadsheet report containing all candidate assessment details and Round 4 interview status for <b>%s</b>.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid #008080; padding: 12px; margin: 16px 0;">
                    <p style="margin: 0;">📎 <b>Attached File:</b> %s</p>
                </div>
                <p>You can use this file for offline review, scheduling interviews externally, or internal HR documentation.</p>
                <br>
                <p>Best Regards,<br><b>SmartHire AI Platform</b></p>
            </div>
            """, jobTitle, filename);

        emailService.sendEmailWithAttachment(recruiterEmail, subject, body, filename, excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }
}
