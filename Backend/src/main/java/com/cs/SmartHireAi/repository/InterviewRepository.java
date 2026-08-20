package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.InterviewMeeting;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class InterviewRepository {

    private final JdbcTemplate jdbcTemplate;

    public void saveOrUpdateMeeting(Long jobId, Long applicantId, String meetingLink, LocalDateTime meetingTime) {
        String checkSql = "SELECT COUNT(*) FROM interview_meetings WHERE job_id = ? AND applicant_id = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, jobId, applicantId);

        if (count != null && count > 0) {
            String updateSql = """
                UPDATE interview_meetings
                SET meeting_link = ?, meeting_time = ?
                WHERE job_id = ? AND applicant_id = ?
            """;
            jdbcTemplate.update(updateSql, meetingLink, meetingTime, jobId, applicantId);
        } else {
            String insertSql = """
                INSERT INTO interview_meetings (job_id, applicant_id, meeting_link, meeting_time)
                VALUES (?, ?, ?, ?)
            """;
            jdbcTemplate.update(insertSql, jobId, applicantId, meetingLink, meetingTime);
        }
    }

    public InterviewMeeting findByJobAndApplicant(Long jobId, Long applicantId) {
        String sql = """
            SELECT m.id, m.job_id, m.applicant_id, m.meeting_link, m.meeting_time, a.round4_status
            FROM interview_meetings m
            LEFT JOIN applications a ON m.job_id = a.job_id AND m.applicant_id = a.applicant_id
            WHERE m.job_id = ? AND m.applicant_id = ?
            ORDER BY m.id DESC LIMIT 1
        """;
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
                InterviewMeeting m = new InterviewMeeting();
                m.setId(rs.getLong("id"));
                m.setJobId(rs.getLong("job_id"));
                m.setApplicantId(rs.getLong("applicant_id"));

                String r4Status = rs.getString("round4_status");
                boolean isDone = "SELECTED".equalsIgnoreCase(r4Status) || "REJECTED".equalsIgnoreCase(r4Status) || "COMPLETED".equalsIgnoreCase(r4Status);

                m.setExpired(isDone);
                m.setInterviewStatus(isDone ? "EXPIRED" : (r4Status != null ? r4Status : "ACTIVE"));

                if (isDone) {
                    m.setMeetingLink(null);
                } else {
                    m.setMeetingLink(rs.getString("meeting_link"));
                }

                if (rs.getTimestamp("meeting_time") != null) {
                    m.setMeetingTime(rs.getTimestamp("meeting_time").toLocalDateTime());
                }
                return m;
            }, jobId, applicantId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public void updateRound4Status(Long jobId, Long applicantId, String status) {
        String sql = "UPDATE applications SET round4_status = ? WHERE job_id = ? AND applicant_id = ?";
        jdbcTemplate.update(sql, status, jobId, applicantId);
    }
}
