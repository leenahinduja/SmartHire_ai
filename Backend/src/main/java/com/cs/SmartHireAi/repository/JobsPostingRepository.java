package com.cs.SmartHireAi.repository;


import com.cs.SmartHireAi.model.Job;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.batch.BatchProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class JobsPostingRepository {
    @Autowired
    JdbcTemplate jdbcTemplate;
    public void save(Job job) {
        jdbcTemplate.update(
                "INSERT INTO jobs (recruiter_id, title, description, required_skills, location, salary_range, job_type, deadline, created_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
                job.getRecruiterId(),
                job.getTitle(),
                job.getDescription(),
                job.getRequiredSkills(),
                job.getLocation(),
                job.getSalaryRange(),
                job.getJobType(),
                job.getDeadline()
        );
    }
    public List<Job> getAllJobs() {
        String sql = "SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count FROM jobs j";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Job job = new Job();
            job.setId(rs.getLong("id"));
            job.setRecruiterId(rs.getLong("recruiter_id"));
            job.setTitle(rs.getString("title"));
            job.setDescription(rs.getString("description"));
            job.setRequiredSkills(rs.getString("required_skills"));
            job.setLocation(rs.getString("location"));
            job.setSalaryRange(rs.getString("salary_range"));
            job.setJobType(rs.getString("job_type"));
            if (rs.getDate("deadline") != null) {
                job.setDeadline(rs.getDate("deadline").toLocalDate());
            }
            try {
                job.setApplicantCount(rs.getInt("applicant_count"));
            } catch (Exception e) {
                job.setApplicantCount(0);
            }
            return job;
        });
    }
    // GET JOB BY ID
    public Job getJobById(Long id) {
        String sql = "SELECT j.*, (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) as applicant_count FROM jobs j WHERE j.id = ?";
        return jdbcTemplate.queryForObject(
                sql,
                (rs, rowNum) -> {
                    Job job = new Job();
                    job.setId(rs.getLong("id"));
                    job.setRecruiterId(rs.getLong("recruiter_id"));
                    job.setTitle(rs.getString("title"));
                    job.setDescription(rs.getString("description"));
                    job.setRequiredSkills(rs.getString("required_skills"));
                    job.setLocation(rs.getString("location"));
                    job.setSalaryRange(rs.getString("salary_range"));
                    job.setJobType(rs.getString("job_type"));
                    if (rs.getDate("deadline") != null) {
                        job.setDeadline(rs.getDate("deadline").toLocalDate());
                    }
                    try {
                        job.setApplicantCount(rs.getInt("applicant_count"));
                    } catch (Exception e) {
                        job.setApplicantCount(0);
                    }
                    return job;
                },
                id
        );
    }
    // UPDATE JOB
    public void updateJob(Job job) {
        jdbcTemplate.update(
                "UPDATE jobs SET title=?, description=?, location=? WHERE id=?",
                job.getTitle(),
                job.getDescription(),
                job.getLocation(),
                job.getId()
        );
    }
    // DELETE JOB
    public void deleteJob(Long id) {
        jdbcTemplate.update("UPDATE jobs SET active_yn = 0 WHERE id = ?", id);
    }


}
