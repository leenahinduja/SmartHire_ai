package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.RecruiterProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RecruiterProfileRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    public void save(RecruiterProfile rp) {
        jdbcTemplate.update(
                "INSERT INTO recruiter_profiles (user_id, company_name, company_website, designation) VALUES (?, ?, ?, ?)",
                rp.getUserId(), rp.getCompanyName(), rp.getCompanyWebsite(), rp.getDesignation());
    }

    public void update(RecruiterProfile rp) {
        jdbcTemplate.update(
                "UPDATE recruiter_profiles SET company_name=?, company_website=?, designation=? WHERE user_id=?",
                rp.getCompanyName(), rp.getCompanyWebsite(), rp.getDesignation(), rp.getUserId());
    }

    public RecruiterProfile findByUserId(Long userId) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT * FROM recruiter_profiles WHERE user_id = ?",
                    (rs, rn) -> {
                        RecruiterProfile rp = new RecruiterProfile();
                        rp.setId(rs.getLong("id"));
                        rp.setUserId(rs.getLong("user_id"));
                        rp.setCompanyName(rs.getString("company_name"));
                        rp.setCompanyWebsite(rs.getString("company_website"));
                        rp.setDesignation(rs.getString("designation"));
                        return rp;
                    }, userId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
