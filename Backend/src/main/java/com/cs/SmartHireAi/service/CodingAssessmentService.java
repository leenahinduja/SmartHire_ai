package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.*;
import com.cs.SmartHireAi.repository.CodingProblemRepository;
import com.cs.SmartHireAi.repository.CodingSubmissionRepository;
import com.cs.SmartHireAi.service.executor.CodeExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CodingAssessmentService {

    private final CodeExecutionService codeExecutionService;
    private final CodingProblemRepository codingProblemRepository;
    private final CodingSubmissionRepository codingSubmissionRepository;
    private final com.cs.SmartHireAi.repository.AuthRepository authRepository;
    private final com.cs.SmartHireAi.repository.ApplicationRepository applicationRepository;

    public CodingEligibilityResponse getEligibilityAndProblems(Long jobId, Long userId) {
        User user = authRepository.findById(userId);
        if (user == null) {
            return CodingEligibilityResponse.builder()
                    .eligible(false)
                    .message("User not authenticated or not found.")
                    .build();
        }

        // If Recruiter, always allow access to preview/manage
        if ("ROLE_RECRUITER".equalsIgnoreCase(user.getRole()) || "RECRUITER".equalsIgnoreCase(user.getRole())) {
            List<CodingProblem> problems = codingProblemRepository.findByJobId(jobId);
            return CodingEligibilityResponse.builder()
                    .eligible(true)
                    .problems(problems)
                    .build();
        }

        // For applicant: verify Round 2 status in applications table
        String round2Status = applicationRepository.getRound2Status(userId, jobId);
        if (round2Status == null) {
            return CodingEligibilityResponse.builder()
                    .eligible(false)
                    .message("You have not applied for this job.")
                    .build();
        }

        if (!"SELECTED".equalsIgnoreCase(round2Status)) {
            return CodingEligibilityResponse.builder()
                    .eligible(false)
                    .message("You have not been selected for Round 3 (Coding Assessment) by the recruiter yet.")
                    .build();
        }

        // Check if applicant has already completed their single attempt
        CodingSubmission existingSubmission = codingSubmissionRepository.findLatestByUserAndJob(userId, jobId);
        if (existingSubmission != null) {
            return CodingEligibilityResponse.builder()
                    .eligible(false)
                    .alreadySubmitted(true)
                    .message("You have already completed and submitted your Round 3 Coding Assessment for this job.")
                    .submittedAt(existingSubmission.getSubmittedAt() != null ? existingSubmission.getSubmittedAt().toString() : "")
                    .submissionVerdict(existingSubmission.getStatus())
                    .passedTestCases(existingSubmission.getPassedTestCases())
                    .totalTestCases(existingSubmission.getTotalTestCases())
                    .submittedCode(existingSubmission.getCode())
                    .submittedLanguage(existingSubmission.getLanguage())
                    .build();
        }

        List<CodingProblem> problems = codingProblemRepository.findByJobId(jobId);
        return CodingEligibilityResponse.builder()
                .eligible(true)
                .alreadySubmitted(false)
                .problems(problems)
                .build();
    }

    public ExecutionResult runCode(RunCodeRequest request) {
        int timeoutMs = 2000;
        String input = request.getCustomInput();

        if ((input == null || input.isBlank()) && request.getProblemId() != null) {
            List<CodingTestCase> samples = codingProblemRepository.findTestCasesByProblemId(request.getProblemId(), false);
            if (!samples.isEmpty()) {
                input = samples.get(0).getInputData();
            }
        }

        if (request.getProblemId() != null) {
            CodingProblem problem = codingProblemRepository.findById(request.getProblemId());
            if (problem != null && problem.getTimeLimitMs() != null) {
                timeoutMs = problem.getTimeLimitMs();
            }
        }

        return codeExecutionService.execute(
                request.getLanguage(),
                request.getCode(),
                input != null ? input : "",
                timeoutMs
        );
    }

    public SubmissionResultResponse submitCode(SubmitCodeRequest request, Long userId) {
        CodingProblem problem = codingProblemRepository.findById(request.getProblemId());
        if (problem == null) {
            throw new IllegalArgumentException("Problem not found with id: " + request.getProblemId());
        }

        CodingSubmission existing = codingSubmissionRepository.findLatestByUserAndJob(userId, problem.getJobId());
        if (existing != null) {
            throw new IllegalStateException("You have already submitted your Coding Assessment for this job. Re-attempts are not allowed.");
        }

        List<CodingTestCase> testCases = codingProblemRepository.findTestCasesByProblemId(request.getProblemId(), true);
        if (testCases.isEmpty()) {
            throw new IllegalStateException("No test cases found for problem id: " + request.getProblemId());
        }

        int timeoutMs = problem.getTimeLimitMs() != null ? problem.getTimeLimitMs() : 2000;
        int passedCount = 0;
        long totalExecutionTime = 0;
        String finalStatus = "ACCEPTED";
        String compileError = null;
        String runtimeError = null;
        List<TestCaseResult> testCaseResults = new ArrayList<>();

        int testCaseNumber = 1;
        for (CodingTestCase tc : testCases) {
            ExecutionResult execResult = codeExecutionService.execute(
                    request.getLanguage(),
                    request.getCode(),
                    tc.getInputData() != null ? tc.getInputData() : "",
                    timeoutMs
            );

            // If compilation fails, stop immediately
            if (!execResult.isCompilationSuccess() || "COMPILATION_ERROR".equals(execResult.getStatus())) {
                finalStatus = "COMPILATION_ERROR";
                compileError = execResult.getCompileError() != null ? execResult.getCompileError() : execResult.getStderr();
                break;
            }

            totalExecutionTime += execResult.getExecutionTimeMs();

            boolean passed = false;
            String status = "FAILED";

            if (execResult.isTimeLimitExceeded()) {
                status = "TIME_LIMIT_EXCEEDED";
                if ("ACCEPTED".equals(finalStatus)) {
                    finalStatus = "TIME_LIMIT_EXCEEDED";
                }
            } else if (execResult.getExitCode() != 0 || "RUNTIME_ERROR".equals(execResult.getStatus())) {
                status = "RUNTIME_ERROR";
                runtimeError = execResult.getStderr();
                if ("ACCEPTED".equals(finalStatus) || "WRONG_ANSWER".equals(finalStatus)) {
                    finalStatus = "RUNTIME_ERROR";
                }
            } else {
                // Compare outputs normalized
                String actual = normalizeOutput(execResult.getStdout());
                String expected = normalizeOutput(tc.getExpectedOutput());

                if (actual.equals(expected)) {
                    passed = true;
                    status = "PASSED";
                    passedCount++;
                } else {
                    status = "WRONG_ANSWER";
                    if ("ACCEPTED".equals(finalStatus)) {
                        finalStatus = "WRONG_ANSWER";
                    }
                }
            }

            // Only expose input/output details if it's not hidden
            TestCaseResult tcResult = TestCaseResult.builder()
                    .testCaseNumber(testCaseNumber++)
                    .isHidden(tc.isHidden())
                    .input(tc.isHidden() ? "Hidden Testcase" : tc.getInputData())
                    .expectedOutput(tc.isHidden() ? "Hidden Testcase" : tc.getExpectedOutput())
                    .actualOutput(tc.isHidden() ? (passed ? "Match" : "Mismatch") : execResult.getStdout())
                    .passed(passed)
                    .status(status)
                    .executionTimeMs(execResult.getExecutionTimeMs())
                    .errorMessage(execResult.getStderr())
                    .build();

            testCaseResults.add(tcResult);
        }

        int totalCount = testCases.size();
        double scorePercentage = (totalCount > 0) ? ((double) passedCount / totalCount) * 100.0 : 0.0;

        // Save submission to database
        CodingSubmission submission = CodingSubmission.builder()
                .userId(userId)
                .problemId(request.getProblemId())
                .testId(request.getTestId())
                .code(request.getCode())
                .language(request.getLanguage())
                .status(finalStatus)
                .passedTestCases(passedCount)
                .totalTestCases(totalCount)
                .executionTimeMs(totalExecutionTime)
                .errorMessage(compileError != null ? compileError : runtimeError)
                .build();

        Long submissionId = codingSubmissionRepository.saveSubmission(submission);

        if (problem.getJobId() != null && userId > 0) {
            String round3Verdict = (scorePercentage >= 60.0) ? "SELECTED" : "REJECTED";
            applicationRepository.updateRound3Status(userId, problem.getJobId(), round3Verdict);
        }

        return SubmissionResultResponse.builder()
                .submissionId(submissionId)
                .status(finalStatus)
                .passedTestCases(passedCount)
                .totalTestCases(totalCount)
                .scorePercentage(scorePercentage)
                .totalExecutionTimeMs(totalExecutionTime)
                .compileError(compileError)
                .runtimeError(runtimeError)
                .testCaseResults(testCaseResults)
                .build();
    }

    public Long createProblem(CodingProblem problem, Long recruiterId) {
        Long problemId = codingProblemRepository.createProblem(problem, recruiterId);
        if (problem.getSampleTestCases() != null) {
            for (CodingTestCase tc : problem.getSampleTestCases()) {
                tc.setProblemId(problemId);
                codingProblemRepository.addTestCase(tc);
            }
        }
        return problemId;
    }

    public Long addTestCase(CodingTestCase testCase) {
        return codingProblemRepository.addTestCase(testCase);
    }

    public CodingProblem getProblemById(Long problemId) {
        return codingProblemRepository.findById(problemId);
    }

    public List<CodingProblem> getProblemsByJob(Long jobId) {
        return codingProblemRepository.findByJobId(jobId);
    }

    public List<CodingProblem> getProblemsByTest(Long testId) {
        return codingProblemRepository.findByTestId(testId);
    }

    public List<CodingSubmission> getSubmissions(Long userId, Long problemId) {
        return codingSubmissionRepository.findByUserIdAndProblemId(userId, problemId);
    }

    public List<java.util.Map<String, Object>> getJobSubmissionsForRecruiter(Long jobId) {
        return codingSubmissionRepository.getJobSubmissionsForRecruiter(jobId);
    }

    private String normalizeOutput(String out) {
        if (out == null) return "";
        return out.replace("\r\n", "\n")
                  .trim();
    }
}
