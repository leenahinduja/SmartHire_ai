package com.cs.SmartHireAi.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class Round1Repository {

    private final JdbcTemplate jdbcTemplate;

    public void selectCandidate(Long jobId, Long applicantId) {

        String sql = """
        UPDATE applications
        SET round1_status = 'SELECTED'
        WHERE job_id = ? AND applicant_id = ?
        """;

        jdbcTemplate.update(sql, jobId, applicantId);
    }

    public void rejectCandidate(Long jobId, Long applicantId) {

        String sql = """
        UPDATE applications
        SET round1_status = 'REJECTED'
        WHERE job_id = ? AND applicant_id = ?
        """;

        jdbcTemplate.update(sql, jobId, applicantId);
    }
    public String getRound1Status(Long jobId, Long applicantId) {

        String sql = """
        SELECT round1_status
        FROM applications
        WHERE job_id = ?
        AND applicant_id = ?
    """;

        return jdbcTemplate.queryForObject(
                sql,
                String.class,
                jobId,
                applicantId
        );
    }
}
