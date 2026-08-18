package com.cs.SmartHireAi.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class ResumeRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    public void save(Long userId, String resumeUrl) {
        jdbcTemplate.update(
                "INSERT INTO resumes (user_id, resume_url, uploaded_at) VALUES (?, ?, NOW())",
                userId, resumeUrl);
    }

    public List<Map<String, Object>> findByUserId(Long userId) {
        return jdbcTemplate.queryForList(
                "SELECT * FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC", userId);
    }
}
