package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class QuestionResponse {

    private Long questionId;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
}