package com.cs.SmartHireAi.model;

import lombok.Data;
import java.util.List;

@Data
public class Round2QuestionResponse {
    private boolean eligible;
    private String message;
    private boolean alreadySubmitted;
    private Integer score;
    private String submittedAt;
    private List<QuestionResponse> questions;
}

