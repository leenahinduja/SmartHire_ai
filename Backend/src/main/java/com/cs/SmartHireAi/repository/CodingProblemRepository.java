package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.CodingProblem;
import com.cs.SmartHireAi.model.CodingTestCase;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class CodingProblemRepository {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initSchema() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS coding_problems (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    job_id BIGINT,
                    test_id BIGINT,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    difficulty VARCHAR(50) DEFAULT 'MEDIUM',
                    time_limit_ms INT DEFAULT 2000,
                    memory_limit_mb INT DEFAULT 256,
                    java_template TEXT,
                    python_template TEXT,
                    cpp_template TEXT,
                    js_template TEXT,
                    created_by BIGINT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """);

            ensureColumn("coding_problems", "job_id", "BIGINT");
            ensureColumn("coding_problems", "test_id", "BIGINT");
            ensureColumn("coding_problems", "title", "VARCHAR(255)");
            ensureColumn("coding_problems", "description", "TEXT");
            ensureColumn("coding_problems", "difficulty", "VARCHAR(50) DEFAULT 'MEDIUM'");
            ensureColumn("coding_problems", "time_limit_ms", "INT DEFAULT 2000");
            ensureColumn("coding_problems", "memory_limit_mb", "INT DEFAULT 256");
            ensureColumn("coding_problems", "java_template", "TEXT");
            ensureColumn("coding_problems", "python_template", "TEXT");
            ensureColumn("coding_problems", "cpp_template", "TEXT");
            ensureColumn("coding_problems", "js_template", "TEXT");
            ensureColumn("coding_problems", "created_by", "BIGINT");
            ensureColumn("coding_problems", "created_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS coding_test_cases (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    problem_id BIGINT NOT NULL,
                    input_data TEXT,
                    expected_output TEXT NOT NULL,
                    is_hidden BOOLEAN DEFAULT FALSE,
                    explanation TEXT
                )
            """);

            ensureColumn("coding_test_cases", "problem_id", "BIGINT");
            ensureColumn("coding_test_cases", "input_data", "TEXT");
            ensureColumn("coding_test_cases", "expected_output", "TEXT");
            ensureColumn("coding_test_cases", "is_hidden", "BOOLEAN DEFAULT FALSE");
            ensureColumn("coding_test_cases", "explanation", "TEXT");

            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS coding_submissions (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    problem_id BIGINT NOT NULL,
                    test_id BIGINT,
                    code LONGTEXT NOT NULL,
                    language VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    passed_test_cases INT DEFAULT 0,
                    total_test_cases INT DEFAULT 0,
                    execution_time_ms BIGINT DEFAULT 0,
                    error_message TEXT,
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """);

            ensureColumn("coding_submissions", "user_id", "BIGINT NOT NULL DEFAULT 0");
            ensureColumn("coding_submissions", "problem_id", "BIGINT NOT NULL DEFAULT 0");
            ensureColumn("coding_submissions", "test_id", "BIGINT");
            ensureColumn("coding_submissions", "code", "LONGTEXT");
            ensureColumn("coding_submissions", "language", "VARCHAR(50) DEFAULT 'java'");
            ensureColumn("coding_submissions", "status", "VARCHAR(50) DEFAULT 'PENDING'");
            ensureColumn("coding_submissions", "passed_test_cases", "INT DEFAULT 0");
            ensureColumn("coding_submissions", "total_test_cases", "INT DEFAULT 0");
            ensureColumn("coding_submissions", "execution_time_ms", "BIGINT DEFAULT 0");
            ensureColumn("coding_submissions", "error_message", "TEXT");
            ensureColumn("coding_submissions", "submitted_at", "DATETIME DEFAULT CURRENT_TIMESTAMP");

        } catch (Exception e) {
            System.err.println("Note: Coding schema check/initialization: " + e.getMessage());
        }
    }

    private void ensureColumn(String table, String column, String definition) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                    Integer.class,
                    table,
                    column
            );
            if (count == null || count == 0) {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + definition);
                System.out.println("Added missing column: " + column + " to table " + table);
            }
        } catch (Exception e) {
            System.err.println("Column check error for " + table + "." + column + ": " + e.getMessage());
        }
    }

    private final RowMapper<CodingProblem> problemRowMapper = (rs, rowNum) -> CodingProblem.builder()
            .id(rs.getLong("id"))
            .jobId(rs.getObject("job_id", Long.class))
            .testId(rs.getObject("test_id", Long.class))
            .title(rs.getString("title"))
            .description(rs.getString("description"))
            .difficulty(rs.getString("difficulty"))
            .timeLimitMs(rs.getInt("time_limit_ms"))
            .memoryLimitMb(rs.getInt("memory_limit_mb"))
            .javaTemplate(rs.getString("java_template"))
            .pythonTemplate(rs.getString("python_template"))
            .cppTemplate(rs.getString("cpp_template"))
            .jsTemplate(rs.getString("js_template"))
            .createdBy(rs.getObject("created_by", Long.class))
            .createdAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null)
            .build();

    private final RowMapper<CodingTestCase> testCaseRowMapper = (rs, rowNum) -> CodingTestCase.builder()
            .id(rs.getLong("id"))
            .problemId(rs.getLong("problem_id"))
            .inputData(rs.getString("input_data"))
            .expectedOutput(rs.getString("expected_output"))
            .isHidden(rs.getBoolean("is_hidden"))
            .explanation(rs.getString("explanation"))
            .build();

    public Long createProblem(CodingProblem problem, Long recruiterId) {
        String sql = """
            INSERT INTO coding_problems 
            (job_id, test_id, title, description, difficulty, time_limit_ms, memory_limit_mb, 
             java_template, python_template, cpp_template, js_template, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, problem.getJobId());
            ps.setObject(2, problem.getTestId());
            ps.setString(3, problem.getTitle());
            ps.setString(4, problem.getDescription());
            ps.setString(5, problem.getDifficulty() != null ? problem.getDifficulty() : "MEDIUM");
            ps.setInt(6, problem.getTimeLimitMs() != null ? problem.getTimeLimitMs() : 2000);
            ps.setInt(7, problem.getMemoryLimitMb() != null ? problem.getMemoryLimitMb() : 256);
            ps.setString(8, problem.getJavaTemplate());
            ps.setString(9, problem.getPythonTemplate());
            ps.setString(10, problem.getCppTemplate());
            ps.setString(11, problem.getJsTemplate());
            ps.setObject(12, recruiterId);
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;
    }

    public CodingProblem findById(Long problemId) {
        String sql = "SELECT * FROM coding_problems WHERE id = ?";
        List<CodingProblem> list = jdbcTemplate.query(sql, problemRowMapper, problemId);
        if (list.isEmpty()) return null;
        CodingProblem problem = list.get(0);
        problem.setSampleTestCases(findTestCasesByProblemId(problemId, false));
        return problem;
    }

    public List<CodingProblem> findByJobId(Long jobId) {
        String sql = "SELECT * FROM coding_problems WHERE job_id = ?";
        List<CodingProblem> problems = jdbcTemplate.query(sql, problemRowMapper, jobId);
        for (CodingProblem p : problems) {
            p.setSampleTestCases(findTestCasesByProblemId(p.getId(), false));
        }
        return problems;
    }

    public List<CodingProblem> findByTestId(Long testId) {
        String sql = "SELECT * FROM coding_problems WHERE test_id = ?";
        List<CodingProblem> problems = jdbcTemplate.query(sql, problemRowMapper, testId);
        for (CodingProblem p : problems) {
            p.setSampleTestCases(findTestCasesByProblemId(p.getId(), false));
        }
        return problems;
    }

    public Long addTestCase(CodingTestCase testCase) {
        String sql = """
            INSERT INTO coding_test_cases 
            (problem_id, input_data, expected_output, is_hidden, explanation)
            VALUES (?, ?, ?, ?, ?)
        """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, testCase.getProblemId());
            ps.setString(2, testCase.getInputData());
            ps.setString(3, testCase.getExpectedOutput());
            ps.setBoolean(4, testCase.isHidden());
            ps.setString(5, testCase.getExplanation());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;
    }

    public List<CodingTestCase> findTestCasesByProblemId(Long problemId, boolean includeHidden) {
        String sql = includeHidden
                ? "SELECT * FROM coding_test_cases WHERE problem_id = ?"
                : "SELECT * FROM coding_test_cases WHERE problem_id = ? AND is_hidden = FALSE";
        return jdbcTemplate.query(sql, testCaseRowMapper, problemId);
    }
}
