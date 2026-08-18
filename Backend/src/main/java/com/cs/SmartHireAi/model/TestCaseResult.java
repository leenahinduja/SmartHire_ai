package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {
    private int testCaseNumber;
    private boolean isHidden;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private boolean passed;
    private String status; // PASSED, FAILED, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
    private long executionTimeMs;
    private String errorMessage;
}
