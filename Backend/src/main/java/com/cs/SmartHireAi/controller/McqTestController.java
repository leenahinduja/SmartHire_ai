package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.CreateMcqTestRequest;
import com.cs.SmartHireAi.model.McqTest;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.service.McqTestService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/round2/mcq")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "http://localhost:4200"
)
public class McqTestController {

    private final McqTestService service;
    @Autowired
    AuthRepository authRepository;

    @PostMapping("/create")
    @PreAuthorize("hasRole('RECRUITER')")
    public McqTest createTest(
            @RequestBody CreateMcqTestRequest request,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        Long recruiterId = user.getId();

        return service.createTest(request, recruiterId);
    }

    @PreAuthorize("hasRole('RECRUITER')")
    @PostMapping("/release/{jobId}")
    public org.springframework.http.ResponseEntity<?> releaseTest(@PathVariable("jobId") Long jobId) {
        try {
            service.releaseTest(jobId);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "MCQ test released successfully"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/start/{jobId}")
    @PreAuthorize("hasRole('APPLICANT')")
    public org.springframework.http.ResponseEntity<?> startTest(
            @PathVariable("jobId") Long jobId,
            Authentication authentication
    ) {
        String email = authentication.getName();
        User user = authRepository.findByEmail(email);
        Long applicantId = user.getId();

        String status = service.startTest(jobId, applicantId);

        if ("Test started successfully".equals(status)) {
            McqTest test = service.getTestByJobId(jobId);
            return org.springframework.http.ResponseEntity.ok(test);
        } else {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", status));
        }
    }
}