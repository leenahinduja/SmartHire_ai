package com.cs.SmartHireAi.controller;
import com.cs.SmartHireAi.model.Job;
import com.cs.SmartHireAi.service.JobPostingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/job")
@CrossOrigin(origins = "http://localhost:4200")

public class JobPostingController {
    @Autowired
    JobPostingService jobPostingService;
    @PostMapping("/savejobdetails")
    public ResponseEntity<?>jobdetails(@RequestBody Job job, Authentication authentication){
        try{
            jobPostingService.jobdetails(job,authentication);
        return ResponseEntity.ok(Map.of("message", "Job details saved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
    @GetMapping("/all")
    public ResponseEntity<?> getAllJobs() {
        return ResponseEntity.ok(jobPostingService.getAllJobs());
    }
    // GET JOB BY ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getJob(@PathVariable Long id) {
        return ResponseEntity.ok(jobPostingService.getJobById(id));
    }
    // UPDATE JOB
        @PutMapping("/update/{id}")
        public ResponseEntity<?> updateJob(@PathVariable Long id,@RequestBody Job job, Authentication authentication) {
            try {
                job.setId(id);
                jobPostingService.updateJob(job, authentication);
                return ResponseEntity.ok("Job updated");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            }
        }
    // DELETE JOB
    @PatchMapping("/delete/{id}")
    public ResponseEntity<?> deleteJob(@PathVariable Long id, Authentication authentication) {
        try {
            jobPostingService.deleteJob(id, authentication);
            return ResponseEntity.ok("Job deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/search")
    public ResponseEntity<?> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location) {

        return ResponseEntity.ok(jobPostingService.searchJobs(keyword, location));
    }
}
