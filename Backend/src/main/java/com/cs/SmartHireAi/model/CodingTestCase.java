package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodingTestCase {
    private Long id;
    private Long problemId;
    private String inputData;
    private String expectedOutput;
    private boolean isHidden;
    private String explanation;
}
