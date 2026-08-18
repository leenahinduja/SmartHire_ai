package com.cs.SmartHireAi.service.executor;

import com.cs.SmartHireAi.model.ExecutionResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class JavaLanguageRunner implements LanguageRunner {

    private final ProcessExecutionHelper processHelper;

    @Autowired
    public JavaLanguageRunner(ProcessExecutionHelper processHelper) {
        this.processHelper = processHelper;
    }

    @Override
    public boolean supports(String language) {
        return "java".equalsIgnoreCase(language);
    }

    @Override
    public ExecutionResult execute(String code, String stdinInput, int timeoutMs) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("smarthire_java_");

            // Extract public class name if specified, otherwise default to "Main"
            String className = extractClassName(code);
            if (className == null) {
                className = "Main";
                if (!code.contains("class Main")) {
                    code = "public class Main {\n" + code + "\n}";
                }
            }

            File sourceFile = new File(tempDir.toFile(), className + ".java");
            Files.writeString(sourceFile.toPath(), code, StandardCharsets.UTF_8);

            // 1. Compile with javac
            ProcessBuilder javacPb = new ProcessBuilder("javac", sourceFile.getAbsolutePath());
            javacPb.directory(tempDir.toFile());
            ExecutionResult compileResult = processHelper.runProcess(javacPb, null, 10000);

            if (compileResult.getExitCode() != 0) {
                String compileError = compileResult.getStderr();
                if (compileError == null || compileError.isBlank()) {
                    compileError = compileResult.getStdout();
                }
                // Clean up file paths from compile error message to make it clean for candidate
                if (compileError != null) {
                    compileError = compileError.replace(sourceFile.getAbsolutePath(), className + ".java");
                }
                return ExecutionResult.builder()
                        .status("COMPILATION_ERROR")
                        .compilationSuccess(false)
                        .compileError(compileError)
                        .stderr(compileError)
                        .stdout("")
                        .executionTimeMs(compileResult.getExecutionTimeMs())
                        .exitCode(compileResult.getExitCode())
                        .build();
            }

            // 2. Execute with java
            ProcessBuilder javaPb = new ProcessBuilder("java", "-Xmx256m", "-cp", tempDir.toAbsolutePath().toString(), className);
            javaPb.directory(tempDir.toFile());

            ExecutionResult runResult = processHelper.runProcess(javaPb, stdinInput, timeoutMs);
            runResult.setCompilationSuccess(true);
            return runResult;

        } catch (Exception e) {
            return ExecutionResult.builder()
                    .status("RUNTIME_ERROR")
                    .stderr("Execution failure: " + e.getMessage())
                    .stdout("")
                    .compilationSuccess(false)
                    .exitCode(-1)
                    .build();
        } finally {
            cleanupDirectory(tempDir);
        }
    }

    private String extractClassName(String code) {
        Pattern pattern = Pattern.compile("public\\s+class\\s+([A-Za-z0-9_]+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "Main";
    }

    private void cleanupDirectory(Path dir) {
        if (dir != null && Files.exists(dir)) {
            try {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            } catch (IOException ignored) {}
        }
    }
}
