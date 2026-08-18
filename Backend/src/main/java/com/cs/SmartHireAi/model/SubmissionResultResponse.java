package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResultResponse {
    private Long submissionId;
    private String status; // ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, COMPILATION_ERROR, RUNTIME_ERROR
    private int passedTestCases;
    private int totalTestCases;
    private double scorePercentage;
    private long totalExecutionTimeMs;
    private String compileError;
    private String runtimeError;
    private List<TestCaseResult> testCaseResults;
}
