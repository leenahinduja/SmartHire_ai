package com.cs.SmartHireAi.service;


import com.cs.SmartHireAi.model.Job;
import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.AuthRepository;
import com.cs.SmartHireAi.repository.JobsPostingRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class JobPostingService {
    @Autowired
    JobsPostingRepository jobsPostingRepository;
    @Autowired
    AuthRepository authRepository;
    @Autowired
    JdbcTemplate jdbcTemplate;
    public void jobdetails(Job job, Authentication authentication){
        User user= authRepository.findByEmail(authentication.getName());
            if (!user.getRole().equals("RECRUITER")) {
            throw new RuntimeException("Only recruiters can post jobs");
        }
        job.setRecruiterId(user.getId());
        jobsPostingRepository.save(job);

    }
    // GET ALL
    public List<Job> getAllJobs() {
        return jobsPostingRepository.getAllJobs();
    }
    // GET BY ID
    public Job getJobById(Long id) {
        return jobsPostingRepository.getJobById(id);
    }
    // UPDATE (only recruiter)
    public void updateJob(Job job, Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        if (!user.getRole().equals("RECRUITER")) {
            throw new RuntimeException("Only recruiters can update jobs");
        }

        jobsPostingRepository.updateJob(job);
    }
    // DELETE (only recruiter)
    public void deleteJob(Long id, Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        if (!"RECRUITER".equals(user.getRole())) {
            throw new RuntimeException("Only recruiters can delete jobs");
        }

        jobsPostingRepository.deleteJob(id);
    }
    public List<Job> searchJobs(String keyword, String location) {

        String sql = "SELECT * FROM jobs WHERE active_yn = 1";
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.isEmpty()) {
            sql += " AND (LOWER(title) LIKE LOWER(?) OR LOWER(required_skills) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))";
            params.add("%" + keyword + "%");
            params.add("%" + keyword + "%");
            params.add("%" + keyword + "%");
        }

        if (location != null && !location.isEmpty()) {
            sql += " AND LOWER(location) LIKE LOWER(?)";
            params.add("%" + location + "%");
        }

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
            job.setDeadline(rs.getDate("deadline").toLocalDate());
            return job;
        }, params.toArray());
    }

}
