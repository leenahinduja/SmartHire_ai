package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class CreateMcqQuestionRequest {

    private Long testId;

    private String question;

    private String optionA;

    private String optionB;

    private String optionC;

    private String optionD;

    private String correctOption;
}
