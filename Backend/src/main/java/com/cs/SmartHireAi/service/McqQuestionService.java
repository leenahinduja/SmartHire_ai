package com.cs.SmartHireAi.service;


import com.cs.SmartHireAi.model.AiGeneratedQuestion;
import com.cs.SmartHireAi.model.CreateMcqQuestionRequest;
import com.cs.SmartHireAi.repository.McqQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class McqQuestionService {

    private final McqQuestionRepository repository;

    public void createQuestion(CreateMcqQuestionRequest request) {

        repository.saveQuestion(request);
    }
    public void saveGeneratedQuestions(
            Long testId,
            List<AiGeneratedQuestion> questions
    ) {

        for (AiGeneratedQuestion q : questions) {

            CreateMcqQuestionRequest request =
                    new CreateMcqQuestionRequest();

            request.setTestId(testId);

            request.setQuestion(q.getQuestion());

            request.setOptionA(q.getOptionA());

            request.setOptionB(q.getOptionB());

            request.setOptionC(q.getOptionC());

            request.setOptionD(q.getOptionD());

            request.setCorrectOption(q.getCorrectOption());

            repository.saveQuestion(request);
        }
    }
}
