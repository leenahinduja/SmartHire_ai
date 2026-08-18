package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class AiGeneratedQuestion {

    private String question;

    private String optionA;

    private String optionB;

    private String optionC;

    private String optionD;

    private String correctOption;
}
