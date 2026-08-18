package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.CreateMcqTestRequest;
import com.cs.SmartHireAi.model.McqTest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;

@Repository
@RequiredArgsConstructor
public class McqTestRepository {

    private final JdbcTemplate jdbcTemplate;

    public Long createTest(CreateMcqTestRequest request, Long recruiterId) {

        String sql = """
    INSERT INTO mcq_tests
    (job_id, duration_minutes, total_marks, start_time, end_time, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
""";

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);

            ps.setLong(1, request.getJobId());
            ps.setInt(2, request.getDurationMinutes());
            ps.setInt(3, request.getTotalMarks());

            // Handle null values - use NOW() if not provided
            LocalDateTime startTime = request.getStartTime() != null ?
                    request.getStartTime() : LocalDateTime.now();
            LocalDateTime endTime = request.getEndTime() != null ?
                    request.getEndTime() : LocalDateTime.now().plusMinutes(request.getDurationMinutes());

            ps.setTimestamp(4, Timestamp.valueOf(startTime));
            ps.setTimestamp(5, Timestamp.valueOf(endTime));
            ps.setLong(6, recruiterId);

            return ps;
        }, keyHolder);

        return keyHolder.getKey().longValue();
    }
    public void releaseTest(Long jobId) {

        String sql = """
    UPDATE mcq_tests
    SET is_released = TRUE
    WHERE job_id = ?
    """;

        jdbcTemplate.update(sql, jobId);
    }
    public McqTest findByJobId(Long jobId) {

        String sql = """
        SELECT *
        FROM mcq_tests
        WHERE job_id = ?
        ORDER BY id DESC LIMIT 1
    """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> {

                    McqTest test = new McqTest();

                    test.setId(rs.getLong("id"));
                    test.setJobId(rs.getLong("job_id"));
                    test.setDurationMinutes(rs.getInt("duration_minutes"));
                    test.setTotalMarks(rs.getInt("total_marks"));
                    test.setStartTime(
                            rs.getTimestamp("start_time")
                                    .toLocalDateTime()
                    );
                    test.setEndTime(
                            rs.getTimestamp("end_time")
                                    .toLocalDateTime()
                    );

                    test.setReleased(
                            rs.getBoolean("is_released")
                    );

                    return test;
                },
                jobId
        );
    }
    public McqTest findById(Long id) {

        String sql = """
        SELECT *
        FROM mcq_tests
        WHERE id = ?
    """;

        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> {
                    McqTest test = new McqTest();

                    test.setId(rs.getLong("id"));
                    test.setJobId(rs.getLong("job_id"));
                    test.setDurationMinutes(rs.getInt("duration_minutes"));
                    test.setTotalMarks(rs.getInt("total_marks"));
                    test.setStartTime(rs.getTimestamp("start_time").toLocalDateTime());
                    test.setEndTime(rs.getTimestamp("end_time").toLocalDateTime());
                    test.setReleased(rs.getBoolean("is_released"));

                    return test;
                },
                id
        );
    }

}
