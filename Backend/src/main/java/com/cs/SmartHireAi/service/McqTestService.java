package com.cs.SmartHireAi.service;
import com.cs.SmartHireAi.service.EmailService;

import com.cs.SmartHireAi.model.CreateMcqTestRequest;
import com.cs.SmartHireAi.model.McqTest;
import com.cs.SmartHireAi.repository.McqTestRepository;
import com.cs.SmartHireAi.repository.Round1Repository;
import com.cs.SmartHireAi.repository.ApplicationRepository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class McqTestService {

    private final McqTestRepository repository;
    private final Round1Repository round1Repository;
    private final ApplicationRepository applicationRepository;
    private final EmailService emailService;
    private final JobsPostingRepository jobsPostingRepository;

    public McqTest createTest(CreateMcqTestRequest request, Long recruiterId) {

        Long testId = repository.createTest(request, recruiterId);

        // ✅ correct
        return repository.findById(testId);
    }
    public void releaseTest(Long jobId) {
        // 1. Release the test in DB
        repository.releaseTest(jobId);

        // 2. Fetch qualified candidates
        var candidates = applicationRepository.getQualifiedApplicants(jobId);

        // 3. Get Job Title and Test ID for email
        String jobTitle = jobsPostingRepository.getJobById(jobId).getTitle();
        Long testId = repository.findByJobId(jobId).getId();

        // 4. Send email to each candidate
        for (var candidate : candidates) {
            String email = (String) candidate.get("email");
            String name = (String) candidate.get("name");

            String subject = "Round 2 MCQ Test Released – " + jobTitle;
            String body = String.format("""
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #008080;">Hello %s!</h2>
                    <p>The <b>Round 2 MCQ Test</b> for the position of <b>%s</b> has been released.</p>
                    <p>Click the button below to start your test. You will be asked to login before the test begins.</p>
                    <div style="margin: 25px 0;">
                        <a href="http://localhost:4200/test/round2/%d" style="background-color: #008080; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Round 2 Test</a>
                    </div>
                    <p>Please complete the test before the deadline mentioned on the platform.</p>
                    <br>
                    <p>Best Regards,<br><b>SmartHire AI Recruitment Team</b></p>
                </div>
                """, name, jobTitle, testId);

            emailService.sendNotificationEmail(email, subject, body);
        }
    }
    public String startTest(Long jobId, Long applicantId) {

        McqTest test = repository.findByJobId(jobId);

        if (test == null) {
            return "Test not found for this job";
        }

        if (!test.isReleased()) {
            return "Test not released yet";
        }

        String status =
                round1Repository.getRound1Status(jobId, applicantId);

        if (status == null || !status.equalsIgnoreCase("SELECTED")) {
            return "Not eligible for this round";
        }

        LocalDateTime now = LocalDateTime.now();

        if (now.isBefore(test.getStartTime())) {
            return "Test not started yet";
        }

        if (now.isAfter(test.getEndTime())) {
            return "Time exceeded";
        }

        return "Test started successfully";
    }

    public McqTest getTestByJobId(Long jobId) {
        return repository.findByJobId(jobId);
    }
}