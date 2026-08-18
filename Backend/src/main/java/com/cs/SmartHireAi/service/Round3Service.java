package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.ApplicationRepository;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class Round3Service {

    private final ApplicationRepository applicationRepository;
    private final AuthRepository authRepository;
    private final JobsPostingRepository jobsPostingRepository;
    private final EmailService emailService;

    public void selectCandidate(Long jobId, Long applicantId) {
        applicationRepository.updateRound3Status(applicantId, jobId, "SELECTED");

        User user = authRepository.findById(applicantId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null)
                ? jobsPostingRepository.getJobById(jobId).getTitle()
                : "Open Position";

        if (user != null) {
            String subject = "Congratulations! You're Selected for Round 4 (Technical & HR Interview) – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #008080;">Congratulations %s!</h2>
                    <p>We are delighted to let you know that you have cleared <b>Round 3: Technical Coding Assessment</b> for <b>%s</b>.</p>
                    <p>You have advanced to <b>Round 4: Technical & HR Interview Round</b>. The hiring team will be scheduling your live interview meeting shortly.</p>
                    <div style="margin: 25px 0; text-align: center;">
                        <a href="http://localhost:4200/my-applications" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to My Applications</a>
                    </div>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public void rejectCandidate(Long jobId, Long applicantId) {
        applicationRepository.updateRound3Status(applicantId, jobId, "REJECTED");

        User user = authRepository.findById(applicantId);
        String jobTitle = (jobsPostingRepository.getJobById(jobId) != null)
                ? jobsPostingRepository.getJobById(jobId).getTitle()
                : "Open Position";

        if (user != null) {
            String subject = "Application Update – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2>Hello %s,</h2>
                    <p>Thank you for participating in our Round 3 Coding Assessment for <b>%s</b>.</p>
                    <p>After reviewing the assessment results, we will not be proceeding with your candidacy further for this position.</p>
                    <p>We wish you all the best in your job search.</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }
}
