package com.cs.SmartHireAi.service;
import com.cs.SmartHireAi.service.EmailService;

import com.cs.SmartHireAi.repository.Round1Repository;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import com.cs.SmartHireAi.repository.McqTestRepository;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.model.McqTest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class Round1Service {

    private final Round1Repository repository;
    private final AuthRepository authRepository;
    private final JobsPostingRepository jobsPostingRepository;
    private final McqTestRepository mcqTestRepository;
    private final EmailService emailService;

    public void selectCandidate(Long jobId, Long applicantId) {
        // 1. Update DB status
        repository.selectCandidate(jobId, applicantId);

        // 2. Fetch details for email
        User user = authRepository.findById(applicantId);
        String jobTitle = jobsPostingRepository.getJobById(jobId).getTitle();

        if (user != null) {
            String subject = "Congratulations! You're Selected for Round 2 – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #008080;">Congratulations %s!</h2>
                    <p>We are pleased to inform you that you have been <b>selected</b> for the next round of the recruitment process for the position of <b>%s</b>.</p>
                    <p>We will be sending you the link for the <b>Round 2 MCQ Test</b> very soon. Please keep an eye on your dashboard and email.</p>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:4200/my-applications" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }

    public void rejectCandidate(Long jobId, Long applicantId) {
        // 1. Update DB status
        repository.rejectCandidate(jobId, applicantId);

        // 2. Send rejection email
        User user = authRepository.findById(applicantId);
        String jobTitle = jobsPostingRepository.getJobById(jobId).getTitle();

        if (user != null) {
            String subject = "Application Update – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #555;">Hello %s,</h2>
                    <p>Thank you for your interest in the position of <b>%s</b> and for taking the time to apply.</p>
                    <p>After careful review, we regret to inform you that we will not be moving forward with your application at this time.</p>
                    <p>We truly appreciate your effort and encourage you to apply for future openings that match your skills and experience.</p>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:4200/jobs" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Browse Other Jobs</a>
                    </div>
                    <p>We wish you all the best in your career journey.</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, user.getName(), jobTitle);

            emailService.sendNotificationEmail(user.getEmail(), subject, body);
        }
    }
}
