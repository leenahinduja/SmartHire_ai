package com.cs.SmartHireAi.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Repository
public class ApplicationRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

        // APPLY JOB
        public void apply(Long applicantId, Long jobId) {
            jdbcTemplate.update(
                    "INSERT INTO applications(job_id, applicant_id, round1_status, round2_status, round3_status, round4_status, applied_at) " +
                            "VALUES (?, ?, 'PENDING', 'PENDING', 'PENDING', 'PENDING', NOW())",
                    jobId, applicantId
            );
        }

        // CHECK DUPLICATE - FIX THIS
        public Integer checkDuplicate(Long applicantId, Long jobId) {
            try {
                Integer count = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM applications WHERE applicant_id=? AND job_id=?",
                        Integer.class, applicantId, jobId
                );
                return count != null ? count : 0;
            } catch (Exception e) {
                return 0;  // No record found, return 0
            }
        }

        // GET MY APPLICATIONS
        public List<Map<String, Object>> getByUser(Long applicantId) {
            String sql = """
                SELECT a.*, j.title, j.location, j.job_type, j.salary_range,
                       im.meeting_link, im.meeting_time
                FROM applications a
                JOIN jobs j ON a.job_id = j.id
                LEFT JOIN interview_meetings im ON im.job_id = a.job_id AND im.applicant_id = a.applicant_id
                WHERE a.applicant_id = ?
                ORDER BY a.id DESC
            """;
            return jdbcTemplate.queryForList(sql, applicantId);
        }

        // RECRUITER VIEW APPLICANTS
        public List<Map<String, Object>> getByJob(Long jobId) {
            String sql = """
                SELECT a.*, u.name, u.email,
                       (SELECT ms.score 
                        FROM mcq_submissions ms 
                        JOIN mcq_tests mt ON ms.test_id = mt.id 
                        WHERE ms.user_id = a.applicant_id AND mt.job_id = a.job_id 
                        ORDER BY ms.id DESC LIMIT 1) AS mcq_score,
                       (SELECT CONCAT(cs.passed_test_cases, '/', cs.total_test_cases, ' (', cs.status, ')') 
                        FROM coding_submissions cs 
                        JOIN coding_problems cp ON cs.problem_id = cp.id 
                        WHERE cs.user_id = a.applicant_id AND cp.job_id = a.job_id 
                        ORDER BY cs.id DESC LIMIT 1) AS coding_score,
                       im.meeting_link, im.meeting_time
                FROM applications a 
                JOIN users u ON a.applicant_id = u.id 
                LEFT JOIN interview_meetings im ON im.job_id = a.job_id AND im.applicant_id = a.applicant_id
                WHERE a.job_id = ?
                ORDER BY a.id DESC
            """;
            return jdbcTemplate.queryForList(sql, jobId);
        }

        // GET STATUS
        public Map<String, Object> getStatus(Long applicantId, Long jobId) {
            try {
                return jdbcTemplate.queryForMap(
                        "SELECT round1_status, round2_status, round3_status, round4_status " +
                                "FROM applications WHERE applicant_id=? AND job_id=?",
                        applicantId, jobId
                );
            } catch (Exception e) {
                return new HashMap<>();
            }
        }
        // GET QUALIFIED APPLICANTS (For Round 2)
        public List<Map<String, Object>> getQualifiedApplicants(Long jobId) {
            return jdbcTemplate.queryForList(
                    "SELECT u.name, u.email " +
                            "FROM applications a " +
                            "JOIN users u ON a.applicant_id = u.id " +
                            "WHERE a.job_id=? AND a.round1_status='SELECTED'",
                    jobId
            );
        }

        public String getRound2Status(Long applicantId, Long jobId) {
            try {
                return jdbcTemplate.queryForObject(
                        "SELECT round2_status FROM applications WHERE applicant_id = ? AND job_id = ?",
                        String.class,
                        applicantId,
                        jobId
                );
            } catch (Exception e) {
                return null;
            }
        }

        public String getRound3Status(Long applicantId, Long jobId) {
            try {
                return jdbcTemplate.queryForObject(
                        "SELECT round3_status FROM applications WHERE applicant_id = ? AND job_id = ?",
                        String.class,
                        applicantId,
                        jobId
                );
            } catch (Exception e) {
                return null;
            }
        }

        public void updateRound3Status(Long applicantId, Long jobId, String status) {
            try {
                jdbcTemplate.update(
                        "UPDATE applications SET round3_status = ? WHERE applicant_id = ? AND job_id = ?",
                        status,
                        applicantId,
                        jobId
                );
            } catch (Exception ignored) {}
        }

        public void updateRound4Status(Long applicantId, Long jobId, String status) {
            try {
                jdbcTemplate.update(
                        "UPDATE applications SET round4_status = ? WHERE applicant_id = ? AND job_id = ?",
                        status,
                        applicantId,
                        jobId
                );
            } catch (Exception ignored) {}
        }
}
