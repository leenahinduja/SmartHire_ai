package com.cs.SmartHireAi.controller;

import com.cs.SmartHireAi.model.AiGeneratedQuestion;
import com.cs.SmartHireAi.model.AiMcqRequest;
import com.cs.SmartHireAi.model.CreateMcqQuestionRequest;
import com.cs.SmartHireAi.service.GeminiMcqService;
import com.cs.SmartHireAi.service.McqQuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/round2/mcq/question")
@RequiredArgsConstructor
@CrossOrigin(
        origins = "http://localhost:4200")
public class McqQuestionController {

    private final GeminiMcqService aiService;    private final McqQuestionService service;

    @PostMapping("/create")
    @PreAuthorize("hasRole('RECRUITER')")
    public org.springframework.http.ResponseEntity<?> createQuestion(
            @RequestBody CreateMcqQuestionRequest request
    ) {

        service.createQuestion(request);

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "MCQ Question Added Successfully"));
    }
    @PostMapping("/create-batch")
    @PreAuthorize("hasRole('RECRUITER')")
    public org.springframework.http.ResponseEntity<?> createQuestionsBatch(
            @RequestBody java.util.List<CreateMcqQuestionRequest> requests
    ) {
        for (CreateMcqQuestionRequest request : requests) {
            service.createQuestion(request);
        }
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Batch Questions Added Successfully"));
    }

    @PostMapping("/generate-ai")
    @PreAuthorize("hasRole('RECRUITER')")
    public org.springframework.http.ResponseEntity<?> generateAiQuestions(
            @RequestBody AiMcqRequest request
    ) throws Exception {

        var questions =
                aiService.generateQuestions(
                        request.getTopic(),
                        request.getDifficulty(),
                        request.getCount()
                );

        service.saveGeneratedQuestions(
                request.getTestId(),
                questions
        );

        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "AI Questions Generated and Saved Successfully"));
    }
}
