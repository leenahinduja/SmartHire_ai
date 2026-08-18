package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.CodingSubmission;
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
public class CodingSubmissionRepository {

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<CodingSubmission> submissionRowMapper = (rs, rowNum) -> CodingSubmission.builder()
            .id(rs.getLong("id"))
            .userId(rs.getLong("user_id"))
            .problemId(rs.getLong("problem_id"))
            .testId(rs.getObject("test_id", Long.class))
            .code(rs.getString("code"))
            .language(rs.getString("language"))
            .status(rs.getString("status"))
            .passedTestCases(rs.getInt("passed_test_cases"))
            .totalTestCases(rs.getInt("total_test_cases"))
            .executionTimeMs(rs.getLong("execution_time_ms"))
            .errorMessage(rs.getString("error_message"))
            .submittedAt(rs.getTimestamp("submitted_at") != null ? rs.getTimestamp("submitted_at").toLocalDateTime() : null)
            .build();

    public Long saveSubmission(CodingSubmission submission) {
        String sql = """
            INSERT INTO coding_submissions
            (user_id, problem_id, test_id, code, language, status, passed_test_cases, 
             total_test_cases, execution_time_ms, error_message, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        """;

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, submission.getUserId());
            ps.setLong(2, submission.getProblemId());
            ps.setObject(3, submission.getTestId());
            ps.setString(4, submission.getCode());
            ps.setString(5, submission.getLanguage());
            ps.setString(6, submission.getStatus());
            ps.setInt(7, submission.getPassedTestCases());
            ps.setInt(8, submission.getTotalTestCases());
            ps.setLong(9, submission.getExecutionTimeMs());
            ps.setString(10, submission.getErrorMessage());
            return ps;
        }, keyHolder);

        return keyHolder.getKey() != null ? keyHolder.getKey().longValue() : null;
    }

    public List<CodingSubmission> findByUserIdAndProblemId(Long userId, Long problemId) {
        String sql = "SELECT * FROM coding_submissions WHERE user_id = ? AND problem_id = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, submissionRowMapper, userId, problemId);
    }

    public List<CodingSubmission> findByUserId(Long userId) {
        String sql = "SELECT * FROM coding_submissions WHERE user_id = ? ORDER BY submitted_at DESC";
        return jdbcTemplate.query(sql, submissionRowMapper, userId);
    }

    public CodingSubmission findLatestByUserAndJob(Long userId, Long jobId) {
        try {
            String sql = """
                SELECT cs.* 
                FROM coding_submissions cs 
                JOIN coding_problems cp ON cs.problem_id = cp.id 
                WHERE cs.user_id = ? AND cp.job_id = ? 
                ORDER BY cs.id DESC LIMIT 1
            """;
            return jdbcTemplate.queryForObject(sql, submissionRowMapper, userId, jobId);
        } catch (Exception e) {
            return null;
        }
    }

    public List<java.util.Map<String, Object>> getJobSubmissionsForRecruiter(Long jobId) {
        String sql = """
            SELECT cs.id, cs.user_id, u.name as applicant_name, u.email as applicant_email,
                   cp.title as problem_title, cs.language, cs.status, cs.passed_test_cases,
                   cs.total_test_cases, cs.execution_time_ms, cs.code, cs.submitted_at
            FROM coding_submissions cs
            JOIN coding_problems cp ON cs.problem_id = cp.id
            JOIN users u ON cs.user_id = u.id
            WHERE cp.job_id = ?
            ORDER BY cs.id DESC
        """;
        return jdbcTemplate.queryForList(sql, jobId);
    }
}
