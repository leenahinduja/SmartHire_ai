package com.cs.SmartHireAi.repository;


import com.cs.SmartHireAi.model.CreateMcqQuestionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class  McqQuestionRepository {

    private final JdbcTemplate jdbcTemplate;

    public void saveQuestion(CreateMcqQuestionRequest request) {

        String sql = """
        INSERT INTO mcq_questions
        (test_id, question, option_a, option_b, option_c, option_d, correct_option)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        jdbcTemplate.update(
                sql,
                request.getTestId(),
                request.getQuestion(),
                request.getOptionA(),
                request.getOptionB(),
                request.getOptionC(),
                request.getOptionD(),
                request.getCorrectOption()
        );
    }
}
