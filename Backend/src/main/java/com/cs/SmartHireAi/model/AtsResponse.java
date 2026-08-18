package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class AtsResponse {
    private int score;
    private List<String> missingSkills;
    private String suggestions;
}
