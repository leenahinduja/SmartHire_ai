package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.AiGeneratedQuestion;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GeminiMcqService {

    private final ChatModel chatModel;

    private final ObjectMapper objectMapper;


    public List<AiGeneratedQuestion> generateQuestions(
            String topic,
            String difficulty,
            int count
    ) {

        try {
            System.out.println("🚀 Calling Gemini API...");   // ✅ ADD HERE

            String promptText = """
Generate %d multiple choice questions on topic %s with %s difficulty.

Return ONLY JSON array:

[
{
"question": "...",
"optionA": "...",
"optionB": "...",
"optionC": "...",
"optionD": "...",
"correctOption": "A"
}
]
""".formatted(count, topic, difficulty);


            Prompt prompt = new Prompt(promptText);


            // Gemini returns JSON text
            String response = chatModel
                    .call(prompt)
                    .getResult()
                    .getOutput()
                    .getText();
            System.out.println("📥 Gemini Response: " + response); // ✅ ADD THIS ALSO


            // Convert JSON text → Java List
            return objectMapper.readValue(
                    response,
                    objectMapper.getTypeFactory()
                            .constructCollectionType(
                                    List.class,
                                    AiGeneratedQuestion.class
                            )
            );

        } catch (Exception e) {
            e.printStackTrace(); // ✅ VERY IMPORTANT (full error dekhne ke liye)

            throw new RuntimeException("Failed to generate AI MCQs", e);
        }
    }
}