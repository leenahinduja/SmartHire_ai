package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.exceptions.UserDoesNotExistException;
import com.cs.SmartHireAi.model.ApplicantProfile;
import com.cs.SmartHireAi.service.ApplicantProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:4200")
@RequestMapping("/applicant")
public class ApplicantProfileController {

    @Autowired ApplicantProfileService profileService;

    // POST /applicant/profile
    @PostMapping("/profile")
    public ResponseEntity<?> saveProfile(@RequestBody ApplicantProfile profile,
                                         Authentication auth) {
        try {
            profileService.saveProfile(profile, auth);
            return ResponseEntity.ok    (Map.of("message", "Profile saved successfully"));
        } catch (UserDoesNotExistException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "An error occurred: " + e.getMessage()));
        }
    }

    // PUT /applicant/profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ApplicantProfile profile,
                                           Authentication auth) {
        try {
            profileService.updateProfile(profile, auth);
            return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
        } catch (UserDoesNotExistException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "An error occurred: " + e.getMessage()));
        }
    }

    // GET /applicant/profile
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication auth) {
        try {
            ApplicantProfile profile = profileService.getProfile(auth);
            if (profile == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // POST /applicant/upload-resume
    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(@RequestParam("file") MultipartFile file,
                                          Authentication auth) {
        try {
            String url = profileService.uploadResume(file, auth);
            return ResponseEntity.ok(Map.of("message", "Resume uploaded successfully", "url", url));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
