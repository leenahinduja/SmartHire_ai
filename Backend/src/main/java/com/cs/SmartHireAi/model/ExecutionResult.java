package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    private String stdout;
    private String stderr;
    private String compileError;
    private int exitCode;
    private long executionTimeMs;
    private boolean timeLimitExceeded;
    private boolean compilationSuccess;
    private String status; // SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
}
