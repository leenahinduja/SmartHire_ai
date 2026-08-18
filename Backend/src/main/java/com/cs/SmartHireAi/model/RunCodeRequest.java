package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RunCodeRequest {
    private Long problemId;
    private String language; // java, python, cpp, javascript
    private String code;
    private String customInput;
}
