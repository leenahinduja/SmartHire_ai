package com.cs.SmartHireAi.service.executor;

import com.cs.SmartHireAi.model.ExecutionResult;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

@Component
public class ProcessExecutionHelper {

    public ExecutionResult runProcess(ProcessBuilder processBuilder, String stdinInput, int timeoutMs) {
        long startTime = System.currentTimeMillis();
        Process process = null;
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            process = processBuilder.start();

            // Write stdin input if provided
            if (stdinInput != null && !stdinInput.isEmpty()) {
                try (OutputStream os = process.getOutputStream();
                     BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8))) {
                    writer.write(stdinInput);
                    writer.flush();
                } catch (IOException ignored) {
                }
            } else {
                try {
                    process.getOutputStream().close();
                } catch (IOException ignored) {}
            }

            // Asynchronously capture stdout and stderr
            Process currentProcess = process;
            Future<String> stdoutFuture = executor.submit(() -> readStream(currentProcess.getInputStream()));
            Future<String> stderrFuture = executor.submit(() -> readStream(currentProcess.getErrorStream()));

            boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
            long executionTime = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                return ExecutionResult.builder()
                        .status("TIME_LIMIT_EXCEEDED")
                        .timeLimitExceeded(true)
                        .compilationSuccess(true)
                        .executionTimeMs(executionTime)
                        .stderr("Time Limit Exceeded (" + timeoutMs + " ms)")
                        .stdout("")
                        .exitCode(-1)
                        .build();
            }

            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS);
            int exitCode = process.exitValue();

            String status = (exitCode == 0) ? "SUCCESS" : "RUNTIME_ERROR";

            return ExecutionResult.builder()
                    .stdout(stdout)
                    .stderr(stderr)
                    .exitCode(exitCode)
                    .executionTimeMs(executionTime)
                    .timeLimitExceeded(false)
                    .compilationSuccess(true)
                    .status(status)
                    .build();

        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            if (process != null) {
                process.destroyForcibly();
            }
            return ExecutionResult.builder()
                    .status("RUNTIME_ERROR")
                    .stderr("Execution error: " + e.getMessage())
                    .stdout("")
                    .executionTimeMs(executionTime)
                    .exitCode(-1)
                    .build();
        } finally {
            executor.shutdownNow();
        }
    }

    public String readStream(InputStream is) {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                if (sb.length() > 64 * 1024) { // Limit output buffer to 64KB
                    sb.append("\n...[Output truncated]...");
                    break;
                }
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
            return sb.toString();
        } catch (IOException e) {
            return "";
        }
    }
}
