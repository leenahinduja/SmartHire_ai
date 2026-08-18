package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.RoundDecisionRequest;
import com.cs.SmartHireAi.service.Round3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/round3")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class Round3Controller {

    private final Round3Service round3Service;

    @PostMapping("/select")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> selectCandidate(@RequestBody RoundDecisionRequest request) {
        round3Service.selectCandidate(request.getJobId(), request.getApplicantId());
        return ResponseEntity.ok(Map.of("message", "Candidate selected for Round 4 (Interview Round)! Notification email sent."));
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> rejectCandidate(@RequestBody RoundDecisionRequest request) {
        round3Service.rejectCandidate(request.getJobId(), request.getApplicantId());
        return ResponseEntity.ok(Map.of("message", "Candidate rejected in Round 3 (Coding)."));
    }
}
