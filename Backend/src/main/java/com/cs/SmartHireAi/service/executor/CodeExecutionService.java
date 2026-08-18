package com.cs.SmartHireAi.service.executor;

import com.cs.SmartHireAi.model.ExecutionResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CodeExecutionService {

    private final List<LanguageRunner> runners;

    @Autowired
    public CodeExecutionService(List<LanguageRunner> runners) {
        this.runners = runners;
    }

    public ExecutionResult execute(String language, String code, String stdinInput, int timeoutMs) {
        if (language == null || language.isBlank()) {
            return ExecutionResult.builder()
                    .status("COMPILATION_ERROR")
                    .stderr("No programming language specified.")
                    .stdout("")
                    .compilationSuccess(false)
                    .exitCode(-1)
                    .build();
        }

        if (code == null || code.isBlank()) {
            return ExecutionResult.builder()
                    .status("COMPILATION_ERROR")
                    .stderr("No code provided for execution.")
                    .stdout("")
                    .compilationSuccess(false)
                    .exitCode(-1)
                    .build();
        }

        int effectiveTimeout = (timeoutMs <= 0) ? 2000 : Math.min(timeoutMs, 10000);

        for (LanguageRunner runner : runners) {
            if (runner.supports(language)) {
                return runner.execute(code, stdinInput, effectiveTimeout);
            }
        }

        return ExecutionResult.builder()
                .status("COMPILATION_ERROR")
                .stderr("Language '" + language + "' is not currently supported.")
                .stdout("")
                .compilationSuccess(false)
                .exitCode(-1)
                .build();
    }
}
