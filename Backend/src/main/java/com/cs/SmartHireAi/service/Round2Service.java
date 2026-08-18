package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.*;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.Round2Repository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class Round2Service {
    @Autowired
    private final Round2Repository round2Repository;
    private final AuthRepository authRepository;
    private final EmailService emailService;
    private final JobsPostingRepository jobsPostingRepository;

    @Autowired
    public Round2Service(Round2Repository round2Repository, AuthRepository authRepository, EmailService emailService, JobsPostingRepository jobsPostingRepository) {
        this.round2Repository = round2Repository;
        this.authRepository = authRepository;
        this.emailService = emailService;
        this.jobsPostingRepository = jobsPostingRepository;
    }

    public Round2QuestionResponse getQuestions(
            Long testId,
            Long userId,
            Long jobId
    ) {

        Round2QuestionResponse response =
                new Round2QuestionResponse();

        // 1. Fetch User Details
        User user = authRepository.findById(userId);
        if (user == null) {
            response.setEligible(false);
            response.setMessage("User not found");
            return response;
        }

        // 2. If User is RECRUITER, allow preview
        if ("ROLE_RECRUITER".equalsIgnoreCase(user.getRole()) || "RECRUITER".equalsIgnoreCase(user.getRole())) {
            response.setEligible(true);
            response.setQuestions(round2Repository.getQuestions(testId));
            return response;
        }

        // 3. For APPLICANTS, check status
        String status = round2Repository.getRound1Status(userId, jobId);

        if (status == null) {
            response.setEligible(false);
            response.setMessage("You did not apply for this job");
            return response;
        }

        if (!status.equalsIgnoreCase("SELECTED")) {
            response.setEligible(false);
            response.setMessage("You are not selected for Round 2");
            return response;
        }

        // 4. Check if applicant has already completed single attempt
        java.util.Map<String, Object> existingSub = round2Repository.getExistingSubmission(userId, testId);
        if (existingSub != null) {
            response.setEligible(false);
            response.setAlreadySubmitted(true);
            response.setScore(existingSub.get("score") != null ? ((Number) existingSub.get("score")).intValue() : 0);
            response.setSubmittedAt(existingSub.get("submitted_at") != null ? existingSub.get("submitted_at").toString() : "");
            response.setMessage("You have already completed and submitted your Round 2 MCQ test.");
            return response;
        }

        response.setEligible(true);
        response.setAlreadySubmitted(false);

        response.setQuestions(
                round2Repository.getQuestions(testId)
        );

        return response;
    }
    public Long startTest(
            Long userId,
            Long testId
    ) {
        java.util.Map<String, Object> existingSub = round2Repository.getExistingSubmission(userId, testId);
        if (existingSub != null) {
            throw new IllegalStateException("You have already submitted this MCQ test. Re-attempts are not allowed.");
        }

        return round2Repository.createSubmission(
                userId,
                testId
        );
    }
    public void logViolation(
            ProctorLogRequest request
    ) {
        round2Repository.logViolation(request);
    }

    public java.util.Map<String, Integer> submitTest(
            SubmitTestRequest request, Long userId
    ) {
        User user = authRepository.findById(userId);
        
        int score = 0;
        int totalQuestions = request.getAnswers().size();
        StringBuilder reportBuilder = new StringBuilder();
        reportBuilder.append("<table border='1' style='border-collapse: collapse; width: 100%; font-family: sans-serif;'>");
        reportBuilder.append("<tr style='background-color: #f2f2f2;'><th style='padding: 8px;'>Question</th><th style='padding: 8px;'>Your Answer</th><th style='padding: 8px;'>Correct Answer</th></tr>");

        for(AnswerDTO ans : request.getAnswers()) {
            String correctAnswer = round2Repository.getCorrectAnswer(ans.getQuestionId());
            String questionText = round2Repository.getQuestionText(ans.getQuestionId());

            boolean correct = correctAnswer.trim().equalsIgnoreCase(ans.getSelectedOption().trim());
            if(correct) score++;

            round2Repository.saveAnswer(request.getSubmissionId(), ans, correct);
            
            reportBuilder.append(String.format("""
                <tr>
                    <td style='padding: 12px; border: 1px solid #eee;'>%s</td>
                    <td style='padding: 12px; border: 1px solid #eee; color: %s; font-weight: bold;'>%s</td>
                    <td style='padding: 12px; border: 1px solid #eee; color: #008080; font-weight: bold;'>%s</td>
                </tr>
                """, 
                questionText, 
                correct ? "#00a86b" : "#e3342f", 
                ans.getSelectedOption(), 
                correctAnswer));
        }
        reportBuilder.append("</table>");

        int percentage = (totalQuestions > 0) ? (score * 100) / totalQuestions : 0;
        round2Repository.updateScore(request.getSubmissionId(), percentage);

        // Immediate Email
        if (user != null) {
            String subject1 = "Round 2 Test Submitted Successfully";
            String body1 = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6;">
                    <h2 style="color: #008080;">Well Done %s!</h2>
                    <p>Your Round 2 MCQ test has been submitted successfully.</p>
                    <p>Our team is reviewing your performance. We will share the detailed results with you shortly.</p>
                    <br><p>Best Regards,<br><b>SmartHire AI Team</b></p>
                </div>
                """, user.getName());
            emailService.sendNotificationEmail(user.getEmail(), subject1, body1);

            // Create effectively final copies for the lambda
            final int finalScore = score;
            final int finalTotal = totalQuestions;
            final int finalPercentage = percentage;
            final String reportHtml = reportBuilder.toString();

            // Delayed Detailed Email (1 second)
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(1000);
                    System.out.println("Initiating detailed result email for: " + user.getEmail());
                    String subject2 = "Round 2 Performance Report - " + user.getName();
                    String body2 = String.format("""
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: auto; border: 1px solid #eee; padding: 25px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #008080; padding-bottom: 15px;">
                                <h2 style="color: #008080; margin: 0; font-size: 24px;">Assessment Performance Report</h2>
                                <p style="color: #666; font-size: 14px; margin-top: 5px;">Round 2 Technical MCQ Test</p>
                            </div>
                            
                            <p>Dear <b>%s</b>,</p>
                            <p>Thank you for completing the Round 2 assessment. Below is your detailed performance breakdown, including correct and incorrect answers for your review.</p>
                            
                            <div style="margin: 25px 0; padding: 25px; background: linear-gradient(135deg, #008080, #00a86b); border-radius: 10px; text-align: center; color: white;">
                                <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Overall Percentage</div>
                                <div style="font-size: 42px; font-weight: bold; margin: 5px 0;">%d%%</div>
                                <div style="font-size: 16px; opacity: 0.9;">Score: %d / %d</div>
                            </div>
                            
                            <h3 style="color: #008080; border-left: 4px solid #008080; padding-left: 12px; margin: 30px 0 15px;">Detailed Analysis</h3>
                            <div style="overflow-x: auto;">
                                %s
                            </div>
                            
                            <div style="margin-top: 35px; padding: 20px; background: #f0fdfa; border-left: 5px solid #008080; border-radius: 4px;">
                                <p style="margin: 0; color: #006d6d; font-size: 15px; font-weight: 500;">
                                    <b>Next Steps:</b> Round 3 (Coding Assessment) will be unlocked for candidates with 50%% or higher score.
                                </p>
                            </div>
                            
                            <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #888; text-align: center;">
                                <p>This is an automated performance report from the SmartHire AI Recruitment System.<br>Please do not reply directly to this email.</p>
                            </div>
                        </div>
                        """, user.getName(), finalPercentage, finalScore, finalTotal, reportHtml);
                    
                    emailService.sendNotificationEmail(user.getEmail(), subject2, body2);
                    System.out.println("Detailed result email successfully dispatched to: " + user.getEmail());
                } catch (Exception e) {
                    System.err.println("CRITICAL: Failed to send detailed result email to " + user.getEmail() + " - " + e.getMessage());
                    e.printStackTrace();
                }
            });
        }

        return java.util.Map.of("score", percentage, "correctCount", score);
    }

    public void selectCandidate(Long jobId, Long applicantId) {
        round2Repository.updateRound2ApplicationStatus(applicantId, jobId, "SELECTED");

        User user = authRepository.findById(applicantId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null) ? jobsPostingRepository.getJobById(jobId).getTitle() : "Position";

        if (user != null) {
            String subject = "Congratulations! You're Selected for Round 3 (Coding Assessment) – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #008080;">Congratulations %s!</h2>
                    <p>We are pleased to inform you that you have cleared the Round 2 MCQ Assessment and are now <b>Selected for Round 3 (Technical Coding Round)</b> for <b>%s</b>.</p>
                    <p>You can now access your coding assessment directly from your dashboard.</p>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:4200/my-applications" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Take Coding Assessment</a>
                    </div>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public void rejectCandidate(Long jobId, Long applicantId) {
        round2Repository.updateRound2ApplicationStatus(applicantId, jobId, "REJECTED");
    }

    public Long getJobIdFromTest(Long testId) {
        return round2Repository.getJobIdFromTest(testId);
    }
}

