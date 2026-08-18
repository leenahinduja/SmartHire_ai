package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.RoundDecisionRequest;
import com.cs.SmartHireAi.service.Round1Service;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/round1")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class Round1Controller {

    private final Round1Service service;
    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/select")
    public org.springframework.http.ResponseEntity<?> selectCandidate(
            @RequestBody RoundDecisionRequest request) {

        service.selectCandidate(
                request.getJobId(),
                request.getApplicantId()
        );

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Candidate selected for Round 2"));
    }
    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/reject")
    public org.springframework.http.ResponseEntity<?> rejectCandidate(
            @RequestBody RoundDecisionRequest request) {

        service.rejectCandidate(
                request.getJobId(),
                request.getApplicantId()
        );

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Candidate rejected in Round 1"));
    }
}
