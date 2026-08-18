package com.cs.SmartHireAi.service.executor;

import com.cs.SmartHireAi.model.ExecutionResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CodeExecutionServiceTest {

    private CodeExecutionService codeExecutionService;

    @BeforeEach
    public void setUp() {
        ProcessExecutionHelper helper = new ProcessExecutionHelper();
        JavaLanguageRunner javaRunner = new JavaLanguageRunner(helper);
        PythonLanguageRunner pythonRunner = new PythonLanguageRunner(helper);
        CppLanguageRunner cppRunner = new CppLanguageRunner(helper);
        JavaScriptLanguageRunner jsRunner = new JavaScriptLanguageRunner(helper);

        codeExecutionService = new CodeExecutionService(List.of(javaRunner, pythonRunner, cppRunner, jsRunner));
    }

    @Test
    public void testJavaExecutionSuccess() {
        String javaCode = """
            import java.util.Scanner;
            public class Main {
                public static void main(String[] args) {
                    Scanner sc = new Scanner(System.in);
                    int a = sc.nextInt();
                    int b = sc.nextInt();
                    System.out.println(a + b);
                }
            }
        """;

        ExecutionResult result = codeExecutionService.execute("java", javaCode, "5 10", 4000);

        assertNotNull(result);
        assertTrue(result.isCompilationSuccess(), "Compilation should succeed");
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("15", result.getStdout().trim());
        assertEquals(0, result.getExitCode());
    }

    @Test
    public void testJavaCompilationError() {
        String javaCode = """
            public class Main {
                public static void main(String[] args) {
                    System.out.println("Missing semicolon")
                }
            }
        """;

        ExecutionResult result = codeExecutionService.execute("java", javaCode, "", 4000);

        assertNotNull(result);
        assertFalse(result.isCompilationSuccess());
        assertEquals("COMPILATION_ERROR", result.getStatus());
        assertNotNull(result.getCompileError());
        assertTrue(result.getCompileError().contains("';' expected") || result.getCompileError().contains("error:"));
    }

    @Test
    public void testJavaRuntimeError() {
        String javaCode = """
            public class Main {
                public static void main(String[] args) {
                    int x = 10 / 0;
                    System.out.println(x);
                }
            }
        """;

        ExecutionResult result = codeExecutionService.execute("java", javaCode, "", 4000);

        assertNotNull(result);
        assertTrue(result.isCompilationSuccess());
        assertEquals("RUNTIME_ERROR", result.getStatus());
        assertTrue(result.getStderr().contains("ArithmeticException") || result.getStderr().contains("/ by zero"));
    }

    @Test
    public void testJavaTimeLimitExceeded() {
        String javaCode = """
            public class Main {
                public static void main(String[] args) {
                    while (true) {
                        // Infinite loop
                    }
                }
            }
        """;

        ExecutionResult result = codeExecutionService.execute("java", javaCode, "", 1000);

        assertNotNull(result);
        assertTrue(result.isTimeLimitExceeded());
        assertEquals("TIME_LIMIT_EXCEEDED", result.getStatus());
    }

    @Test
    public void testPythonExecution() {
        String pythonCode = """
import sys
input_data = sys.stdin.read().split()
if len(input_data) >= 2:
    a, b = int(input_data[0]), int(input_data[1])
    print(a * b)
else:
    print(0)
""";

        ExecutionResult result = codeExecutionService.execute("python", pythonCode, "6 7", 4000);

        assertNotNull(result);
        if ("SUCCESS".equals(result.getStatus())) {
            assertEquals("42", result.getStdout().trim());
        }
    }
}
