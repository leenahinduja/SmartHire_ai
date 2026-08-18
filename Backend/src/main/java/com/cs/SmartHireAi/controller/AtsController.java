package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.AtsResponse;
import com.cs.SmartHireAi.service.AtsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/ats")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")

public class AtsController {

    private final AtsService atsService;

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateScore(
            @RequestParam("resume") MultipartFile resume,
            @RequestParam("jobDescription") String jobDescription,
            @RequestParam("applicantId") Long applicantId,
            @RequestParam("jobId") Long jobId) {
        try {
            AtsResponse response = atsService.calculateATS(resume, jobDescription, applicantId, jobId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "ATS calculation failed",
                    "error", e.getClass().getSimpleName(),
                    "detail", e.getMessage() != null ? e.getMessage() : "null"
            ));
        }
    }
}