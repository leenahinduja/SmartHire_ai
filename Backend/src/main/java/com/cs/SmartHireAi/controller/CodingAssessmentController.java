package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.*;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.service.CodingAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/coding")
@RequiredArgsConstructor
public class CodingAssessmentController {

    private final CodingAssessmentService codingAssessmentService;
    private final AuthRepository authRepository;

    @PostMapping("/run")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExecutionResult> runCode(@RequestBody RunCodeRequest request) {
        ExecutionResult result = codingAssessmentService.runCode(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SubmissionResultResponse> submitCode(
            @RequestBody SubmitCodeRequest request,
            Authentication auth
    ) {
        String email = (auth != null) ? auth.getName() : null;
        User user = (email != null) ? authRepository.findByEmail(email) : null;
        Long userId = (user != null) ? user.getId() : 1L;

        SubmissionResultResponse response = codingAssessmentService.submitCode(request, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/problem/{problemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CodingProblem> getProblem(@PathVariable Long problemId) {
        CodingProblem problem = codingAssessmentService.getProblemById(problemId);
        if (problem == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(problem);
    }

    @GetMapping("/assessment/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CodingEligibilityResponse> getAssessment(
            @PathVariable Long jobId,
            Authentication auth
    ) {
        String email = (auth != null) ? auth.getName() : null;
        User user = (email != null) ? authRepository.findByEmail(email) : null;
        Long userId = (user != null) ? user.getId() : 1L;

        CodingEligibilityResponse response = codingAssessmentService.getEligibilityAndProblems(jobId, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/job/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CodingProblem>> getProblemsByJob(@PathVariable Long jobId) {
        List<CodingProblem> problems = codingAssessmentService.getProblemsByJob(jobId);
        return ResponseEntity.ok(problems);
    }

    @GetMapping("/test/{testId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CodingProblem>> getProblemsByTest(@PathVariable Long testId) {
        List<CodingProblem> problems = codingAssessmentService.getProblemsByTest(testId);
        return ResponseEntity.ok(problems);
    }

    @PostMapping("/problem")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<Long> createProblem(
            @RequestBody CodingProblem problem,
            Authentication auth
    ) {
        String email = (auth != null) ? auth.getName() : null;
        User user = (email != null) ? authRepository.findByEmail(email) : null;
        Long recruiterId = (user != null) ? user.getId() : null;

        Long problemId = codingAssessmentService.createProblem(problem, recruiterId);
        return ResponseEntity.ok(problemId);
    }

    @PostMapping("/testcase")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<Long> addTestCase(@RequestBody CodingTestCase testCase) {
        Long testCaseId = codingAssessmentService.addTestCase(testCase);
        return ResponseEntity.ok(testCaseId);
    }

    @GetMapping("/submissions/{problemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CodingSubmission>> getSubmissions(
            @PathVariable Long problemId,
            Authentication auth
    ) {
        String email = (auth != null) ? auth.getName() : null;
        User user = (email != null) ? authRepository.findByEmail(email) : null;
        Long userId = (user != null) ? user.getId() : 1L;

        List<CodingSubmission> submissions = codingAssessmentService.getSubmissions(userId, problemId);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/recruiter/submissions/{jobId}")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<List<java.util.Map<String, Object>>> getJobSubmissionsForRecruiter(
            @PathVariable Long jobId
    ) {
        List<java.util.Map<String, Object>> submissions = codingAssessmentService.getJobSubmissionsForRecruiter(jobId);
        return ResponseEntity.ok(submissions);
    }
}
