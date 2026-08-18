package com.cs.SmartHireAi.repository;

import com.cs.SmartHireAi.model.ApplicantProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ApplicantProfileRepository {

    @Autowired
    JdbcTemplate jdbcTemplate;

    public void save(ApplicantProfile p) {
        String sql = """
                INSERT INTO applicant_profiles
                    (user_id, phone, education, skills, github_link, linkedin_link,
                     address, city, state, country)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        jdbcTemplate.update(sql,
                p.getUserId(), p.getPhone(), p.getEducation(), p.getSkills(),
                p.getGithubLink(), p.getLinkedinLink(),
                p.getAddress(), p.getCity(), p.getState(), p.getCountry());
    }

    public void update(ApplicantProfile p) {
        String sql = """
                UPDATE applicant_profiles
                SET phone=?, education=?, skills=?, github_link=?, linkedin_link=?,
                    address=?, city=?, state=?, country=?
                WHERE user_id=?
                """;
        jdbcTemplate.update(sql,
                p.getPhone(), p.getEducation(), p.getSkills(),
                p.getGithubLink(), p.getLinkedinLink(),
                p.getAddress(), p.getCity(), p.getState(), p.getCountry(),
                p.getUserId());
    }

    public ApplicantProfile findByUserId(Long userId) {
        String sql = "SELECT * FROM applicant_profiles WHERE user_id = ?";
        try {
            return jdbcTemplate.queryForObject(sql, (rs, rn) -> {
                ApplicantProfile ap = new ApplicantProfile();
                ap.setId(rs.getLong("id"));
                ap.setUserId(rs.getLong("user_id"));
                ap.setPhone(rs.getString("phone"));
                ap.setEducation(rs.getString("education"));
                ap.setSkills(rs.getString("skills"));
                ap.setGithubLink(rs.getString("github_link"));
                ap.setLinkedinLink(rs.getString("linkedin_link"));
                ap.setAddress(rs.getString("address"));
                ap.setCity(rs.getString("city"));
                ap.setState(rs.getString("state"));
                ap.setCountry(rs.getString("country"));
                ap.setAtsScore(rs.getInt("ats_score"));
                return ap;
            }, userId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    // Called after ATS calculation — updates score in applicant_profiles
    public void updateAtsScore(Long userId, int score) {
        jdbcTemplate.update(
                "UPDATE applicant_profiles SET ats_score = ? WHERE user_id = ?",
                score, userId);
    }
}
