package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubmitCodeRequest {
    private Long problemId;
    private Long testId;
    private String language;
    private String code;
}
