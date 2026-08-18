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
public class CodingEligibilityResponse {
    private boolean eligible;
    private String message;
    private boolean alreadySubmitted;
    private String submittedAt;
    private String submissionVerdict;
    private Integer passedTestCases;
    private Integer totalTestCases;
    private String submittedCode;
    private String submittedLanguage;
    private List<CodingProblem> problems;
}
