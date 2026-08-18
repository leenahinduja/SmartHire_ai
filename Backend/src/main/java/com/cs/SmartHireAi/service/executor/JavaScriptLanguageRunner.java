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
public class JavaScriptLanguageRunner implements LanguageRunner {

    private final ProcessExecutionHelper processHelper;

    @Autowired
    public JavaScriptLanguageRunner(ProcessExecutionHelper processHelper) {
        this.processHelper = processHelper;
    }

    @Override
    public boolean supports(String language) {
        if (language == null) return false;
        String lang = language.toLowerCase().trim();
        return lang.equals("javascript") || lang.equals("js") || lang.equals("node");
    }

    @Override
    public ExecutionResult execute(String code, String stdinInput, int timeoutMs) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("smarthire_js_");
            File scriptFile = new File(tempDir.toFile(), "solution.js");
            Files.writeString(scriptFile.toPath(), code, StandardCharsets.UTF_8);

            ProcessBuilder pb = new ProcessBuilder("node", scriptFile.getAbsolutePath());
            pb.directory(tempDir.toFile());

            ExecutionResult result = processHelper.runProcess(pb, stdinInput, timeoutMs);
            result.setCompilationSuccess(true);
            return result;

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
