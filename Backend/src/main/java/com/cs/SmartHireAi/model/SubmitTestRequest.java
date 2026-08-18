package com.cs.SmartHireAi.model;

import lombok.Data;
import java.util.List;

@Data
public class SubmitTestRequest {

    private Long submissionId;

    private List<AnswerDTO> answers;
}
