package com.cs.SmartHireAi.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class AtsScoreRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    public void save(Long applicantId, Long jobId, int score) {
        // Upsert: update if exists, insert otherwise
        String checkSql = "SELECT id FROM ats_scores WHERE applicant_id = ? AND job_id = ?";
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(checkSql, applicantId, jobId);

        if (existing.isEmpty()) {
            jdbcTemplate.update(
                    "INSERT INTO ats_scores (applicant_id, job_id, score, calculated_at) VALUES (?, ?, ?, NOW())",
                    applicantId, jobId, score);
        } else {
            jdbcTemplate.update(
                    "UPDATE ats_scores SET score = ?, calculated_at = NOW() WHERE applicant_id = ? AND job_id = ?",
                    score, applicantId, jobId);
        }
    }

    public List<Map<String, Object>> findByApplicantId(Long applicantId) {
        return jdbcTemplate.queryForList(
                "SELECT * FROM ats_scores WHERE applicant_id = ? ORDER BY calculated_at DESC", applicantId);
    }
}
