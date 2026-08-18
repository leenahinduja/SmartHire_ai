package com.cs.SmartHireAi.model;
import lombok.Data;

@Data
public class AiMcqRequest {

    private Long testId;

    private String topic;

    private String difficulty;

    private int count;
}