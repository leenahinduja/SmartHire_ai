package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class McqQuestion {
    private Long id;
    private Long testId;
    private String question;
    private String optionA;
    private String optionB;
    private String optionC;
    private String optionD;
    private String correctOption;
}
