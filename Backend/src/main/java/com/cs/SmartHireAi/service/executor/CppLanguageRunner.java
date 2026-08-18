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

@Component
public class CppLanguageRunner implements LanguageRunner {

    private final ProcessExecutionHelper processHelper;

    @Autowired
    public CppLanguageRunner(ProcessExecutionHelper processHelper) {
        this.processHelper = processHelper;
    }

    @Override
    public boolean supports(String language) {
        if (language == null) return false;
        String lang = language.toLowerCase().trim();
        return lang.equals("cpp") || lang.equals("c++") || lang.equals("c");
    }

    @Override
    public ExecutionResult execute(String code, String stdinInput, int timeoutMs) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("smarthire_cpp_");
            File sourceFile = new File(tempDir.toFile(), "solution.cpp");
            Files.writeString(sourceFile.toPath(), code, StandardCharsets.UTF_8);

            boolean isWindows = System.getProperty("os.name").toLowerCase().contains("win");
            String outputExeName = isWindows ? "solution.exe" : "solution";
            File outputFile = new File(tempDir.toFile(), outputExeName);

            // 1. Compile with g++
            ProcessBuilder compilePb = new ProcessBuilder("g++", "-O2", sourceFile.getAbsolutePath(), "-o", outputFile.getAbsolutePath());
            compilePb.directory(tempDir.toFile());
            ExecutionResult compileResult = processHelper.runProcess(compilePb, null, 10000);

            if (compileResult.getExitCode() != 0) {
                String compileError = compileResult.getStderr();
                if (compileError == null || compileError.isBlank()) {
                    compileError = compileResult.getStdout();
                }
                if (compileError != null) {
                    compileError = compileError.replace(sourceFile.getAbsolutePath(), "solution.cpp");
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

            // 2. Execute compiled binary
            ProcessBuilder runPb = new ProcessBuilder(outputFile.getAbsolutePath());
            runPb.directory(tempDir.toFile());

            ExecutionResult runResult = processHelper.runProcess(runPb, stdinInput, timeoutMs);
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
