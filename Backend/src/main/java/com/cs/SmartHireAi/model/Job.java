package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
public class Job {
    private Long id;
    private Long recruiterId;
    private String title;
    private String description;
    private String requiredSkills;
    private String location;
    private String salaryRange;
    private String jobType;
    private LocalDate deadline;
    private LocalDateTime createdAt;
}
