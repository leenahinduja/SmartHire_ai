package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.InterviewMeeting;
import com.cs.SmartHireAi.model.RoundDecisionRequest;
import com.cs.SmartHireAi.model.ScheduleInterviewRequest;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/interview")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class InterviewController {

    private final InterviewService interviewService;
    private final AuthRepository authRepository;

    @PostMapping("/schedule")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> scheduleInterview(@RequestBody ScheduleInterviewRequest request) {
        interviewService.scheduleInterview(request);
        return ResponseEntity.ok(Map.of("message", "Interview scheduled successfully and email notification sent!"));
    }

    @PostMapping("/schedule-slot")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> scheduleTimeSlotWindow(@RequestBody com.cs.SmartHireAi.model.ScheduleSlotRequest request) {
        interviewService.scheduleTimeSlotWindow(request);
        return ResponseEntity.ok(Map.of("message", "Time slot notifications sent to all shortlisted candidates successfully!"));
    }

    @PostMapping("/call-candidate")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> callCandidateLive(@RequestBody com.cs.SmartHireAi.model.CallCandidateRequest request) {
        interviewService.callCandidateLive(request);
        return ResponseEntity.ok(Map.of("message", "Live interview call link sent to candidate with 2-minute joining alert!"));
    }

    @GetMapping("/meeting/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMeeting(@PathVariable Long jobId, Authentication auth) {
        String email = (auth != null) ? auth.getName() : null;
        User user = (email != null) ? authRepository.findByEmail(email) : null;
        Long applicantId = (user != null) ? user.getId() : 1L;

        InterviewMeeting meeting = interviewService.getMeeting(jobId, applicantId);
        if (meeting == null) {
            return ResponseEntity.ok(Map.of("scheduled", false));
        }
        return ResponseEntity.ok(meeting);
    }

    @PostMapping("/select")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> selectCandidate(@RequestBody RoundDecisionRequest request) {
        interviewService.selectCandidate(request.getJobId(), request.getApplicantId());
        return ResponseEntity.ok(Map.of("message", "Candidate selected and hired! Congratulations email sent."));
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> rejectCandidate(@RequestBody RoundDecisionRequest request) {
        interviewService.rejectCandidate(request.getJobId(), request.getApplicantId());
        return ResponseEntity.ok(Map.of("message", "Candidate rejected in Interview round."));
    }

    @GetMapping("/export-excel/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<byte[]> exportExcel(@PathVariable Long jobId) {
        byte[] excelBytes = interviewService.generateRound4ExcelReport(jobId);
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=Shortlisted_Applicants_Job_" + jobId + ".xlsx")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(excelBytes);
    }

    @PostMapping("/email-excel/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> emailExcel(
            @PathVariable Long jobId,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth
    ) {
        String email = (body != null && body.containsKey("email") && !body.get("email").isBlank())
                ? body.get("email").trim()
                : ((auth != null) ? auth.getName() : null);

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please enter a valid recipient email address."));
        }
        interviewService.emailRound4ExcelReport(jobId, email);
        return ResponseEntity.ok(Map.of("message", "Shortlisted candidates CSV/Excel file successfully dispatched to " + email));
    }
}
