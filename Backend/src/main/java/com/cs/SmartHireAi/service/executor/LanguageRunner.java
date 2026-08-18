package com.cs.SmartHireAi.service.executor;

import com.cs.SmartHireAi.model.ExecutionResult;

public interface LanguageRunner {
    boolean supports(String language);
    ExecutionResult execute(String code, String stdinInput, int timeoutMs);
}
