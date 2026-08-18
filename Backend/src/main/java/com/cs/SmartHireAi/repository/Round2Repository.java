package com.cs.SmartHireAi.repository;


import com.cs.SmartHireAi.model.AnswerDTO;
import com.cs.SmartHireAi.model.ProctorLogRequest;
import com.cs.SmartHireAi.model.QuestionResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;


import java.util.List;

@Repository
public class Round2Repository {
    @Autowired
    JdbcTemplate jdbcTemplate;

    public List<QuestionResponse> getQuestions(Long testId) {

        String sql = """
            SELECT id, question,
            option_a, option_b,
            option_c, option_d
            FROM mcq_questions
            WHERE test_id = ?
        """;

        return jdbcTemplate.query(sql,
                (rs, rowNum) -> {

                    QuestionResponse q =
                            new QuestionResponse();

                    q.setQuestionId(rs.getLong("id"));
                    q.setQuestion(rs.getString("question"));
                    q.setOptionA(rs.getString("option_a"));
                    q.setOptionB(rs.getString("option_b"));
                    q.setOptionC(rs.getString("option_c"));
                    q.setOptionD(rs.getString("option_d"));

                    return q;
                },
                testId
        );
    }
    public Long createSubmission(
            Long userId,
            Long testId
    ) {

        String sql = """
            INSERT INTO mcq_submissions
            (user_id, test_id)
            VALUES (?, ?)
        """;

        jdbcTemplate.update(
                sql,
                userId,
                testId
        );

        return jdbcTemplate.queryForObject(
                "SELECT LAST_INSERT_ID()",
                Long.class
        );
    }
    public java.util.Map<String, Object> getExistingSubmission(Long userId, Long testId) {
        try {
            String sql = "SELECT * FROM mcq_submissions WHERE user_id = ? AND test_id = ? AND submitted_at IS NOT NULL ORDER BY id DESC LIMIT 1";
            return jdbcTemplate.queryForMap(sql, userId, testId);
        } catch (Exception e) {
            return null;
        }
    }

    public void insertLog(
            ProctorLogRequest request
    ) {

        String sql = """
            INSERT INTO mcq_proctor_logs
            (submission_id, event_type)
            VALUES (?, ?)
        """;

        jdbcTemplate.update(
                sql,
                request.getSubmissionId(),
                request.getEventType()
        );
    }

    public void logViolation(ProctorLogRequest request) {
        insertLog(request);
    }
    public void saveAnswer(
            Long submissionId,
            AnswerDTO ans,
            boolean correct
    ) {

        String sql = """
            INSERT INTO mcq_answers
            (submission_id,
             question_id,
             selected_option,
             is_correct)
            VALUES (?, ?, ?, ?)
        """;

        jdbcTemplate.update(
                sql,
                submissionId,
                ans.getQuestionId(),
                ans.getSelectedOption(),
                correct
        );
    }
    public void updateScore(
            Long submissionId,
            int score
    ) {

        String sql = """
            UPDATE mcq_submissions
            SET score = ?,
            submitted_at = NOW()
            WHERE id = ?
        """;

        jdbcTemplate.update(
                sql,
                score,
                submissionId
        );
    }
    public String getCorrectAnswer(Long questionId) {

        String sql = """
            SELECT correct_option
            FROM mcq_questions
            WHERE id = ?
        """;

        return jdbcTemplate.queryForObject(
                sql,
                String.class,
                questionId
        );
    }
    public String getRound1Status(Long userId, Long jobId) {

        String sql = """
            SELECT round1_status
            FROM applications
            WHERE applicant_id = ?
            AND job_id = ?
        """;

        List<String> result = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getString("round1_status"),
                userId,
                jobId
        );
        if (result.isEmpty()) {
            return null;
        }

        return result.get(0);
    }
    public Long getJobIdFromTest(Long testId) {

        String sql = """
            SELECT job_id
            FROM mcq_tests
            WHERE id = ?
        """;

        return jdbcTemplate.queryForObject(
                sql,
                Long.class,
                testId
        );
    }

    public String getQuestionText(Long questionId) {
        String sql = "SELECT question FROM mcq_questions WHERE id = ?";
        return jdbcTemplate.queryForObject(sql, String.class, questionId);
    }

    public Long getJobIdFromSubmission(Long submissionId) {
        try {
            String sql = """
                SELECT t.job_id 
                FROM mcq_submissions s 
                JOIN mcq_tests t ON s.test_id = t.id 
                WHERE s.id = ?
            """;
            return jdbcTemplate.queryForObject(sql, Long.class, submissionId);
        } catch (Exception e) {
            return null;
        }
    }

    public void updateRound2ApplicationStatus(Long userId, Long jobId, String status) {
        try {
            jdbcTemplate.update(
                "UPDATE applications SET round2_status = ? WHERE applicant_id = ? AND job_id = ?",
                status, userId, jobId
            );
        } catch (Exception ignored) {}
    }
}