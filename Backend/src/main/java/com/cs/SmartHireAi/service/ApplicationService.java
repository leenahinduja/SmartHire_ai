package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.User;
import com.cs.SmartHireAi.repository.ApplicationRepository;
import com.cs.SmartHireAi.repository.AuthRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ApplicationService {

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    AuthRepository authRepository;

    @Autowired
    JdbcTemplate jdbcTemplate;

    // APPLY JOB
    public void apply(Long jobId, Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        // ROLE CHECK
        if (!"APPLICANT".equals(user.getRole())) {
            throw new RuntimeException("Only applicants can apply");
        }

        // JOB ACTIVE CHECK
        Integer jobCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM jobs WHERE id=? AND active_yn=1",
                Integer.class, jobId
        );

        if (jobCount == null || jobCount == 0) {
            throw new RuntimeException("Job not available");
        }

        // DUPLICATE CHECK
        Integer count = applicationRepository.checkDuplicate(user.getId(), jobId);

        if (count != null && count > 0) {
            throw new RuntimeException("Already applied");
        }

        System.out.println("Application add kara hai bhai ");

        applicationRepository.apply(user.getId(), jobId);
    }

    // MY APPLICATIONS
    public List<Map<String, Object>> getMyApplications(Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        return applicationRepository.getByUser(user.getId());
    }

    // RECRUITER VIEW APPLICANTS
    public List<Map<String, Object>> getApplicants(Long jobId, Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        if (!"RECRUITER".equals(user.getRole())) {
            throw new RuntimeException("Only recruiters allowed");
        }

        return applicationRepository.getByJob(jobId);
    }

    // APPLICATION STATUS
    public Map<String, Object> getStatus(Long jobId, Authentication authentication) {

        String email = authentication.getName();
        User user = authRepository.findByEmail(email);

        return applicationRepository.getStatus(user.getId(), jobId);
    }
}