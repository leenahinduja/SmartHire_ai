package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingProblem {
    private Long id;
    private Long jobId;
    private Long testId;
    private String title;
    private String description;
    private String difficulty; // EASY, MEDIUM, HARD
    private Integer timeLimitMs; // e.g. 2000 ms
    private Integer memoryLimitMb; // e.g. 256 MB
    private String javaTemplate;
    private String pythonTemplate;
    private String cppTemplate;
    private String jsTemplate;
    private Long createdBy;
    private LocalDateTime createdAt;
    private List<CodingTestCase> sampleTestCases;
}
