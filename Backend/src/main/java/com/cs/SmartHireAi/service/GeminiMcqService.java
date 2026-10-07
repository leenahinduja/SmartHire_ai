package com.cs.SmartHireAi.service;

import com.cs.SmartHireAi.model.AiGeneratedQuestion;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiMcqService {

    @Value("${spring.ai.google.genai.api-key:}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public List<AiGeneratedQuestion> generateQuestions(
            String topic,
            String difficulty,
            int count
    ) {
        if (apiKey != null && !apiKey.isBlank()) {
            String cleanKey = apiKey.trim();
            String[] models = {"gemini-3.5-flash-lite", "gemini-3.8-flash"};

            for (String modelName : models) {
                // Retry up to 3 times if Google returns 503 High Demand Spike
                for (int attempt = 1; attempt <= 3; attempt++) {
                    try {
                        System.out.println("🚀 Calling Google AI Studio (" + modelName + " - Attempt " + attempt + ") for topic: " + topic + " (" + difficulty + ")...");
                        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + cleanKey;

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

                        Map<String, Object> requestBody = new HashMap<>();
                        List<Map<String, Object>> contents = new ArrayList<>();
                        Map<String, Object> contentObj = new HashMap<>();
                        List<Map<String, String>> parts = new ArrayList<>();
                        Map<String, String> partObj = new HashMap<>();
                        partObj.put("text", promptText);
                        parts.add(partObj);
                        contentObj.put("parts", parts);
                        contents.add(contentObj);
                        requestBody.put("contents", contents);

                        HttpHeaders headers = new HttpHeaders();
                        headers.setContentType(MediaType.APPLICATION_JSON);
                        headers.set("x-goog-api-key", cleanKey);
                        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                        String rawResponse = restTemplate.postForObject(url, entity, String.class);

                        if (rawResponse != null) {
                            JsonNode root = objectMapper.readTree(rawResponse);
                            JsonNode textNode = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
                            if (textNode != null && !textNode.isMissingNode()) {
                                String jsonText = textNode.asText().trim();
                                if (jsonText.startsWith("```json")) {
                                    jsonText = jsonText.substring(7);
                                }
                                if (jsonText.startsWith("```")) {
                                    jsonText = jsonText.substring(3);
                                }
                                if (jsonText.endsWith("```")) {
                                    jsonText = jsonText.substring(0, jsonText.length() - 3);
                                }
                                jsonText = jsonText.trim();

                                System.out.println("✅ Gemini AI MCQ Generation Success via " + modelName + "!");
                                return objectMapper.readValue(
                                        jsonText,
                                        objectMapper.getTypeFactory().constructCollectionType(List.class, AiGeneratedQuestion.class)
                                );
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ " + modelName + " Attempt #" + attempt + " failed: " + e.getMessage());
                        if (e.getMessage() != null && e.getMessage().contains("503")) {
                            try { Thread.sleep(800); } catch (InterruptedException ignored) {}
                        } else {
                            break; // Move to next model if non-503 error
                        }
                    }
                }
            }
        }

        System.err.println("⚠️ All Gemini model attempts offline/restricted. Using AI fallback question generator.");
        return generateFallbackQuestions(topic, difficulty, count);
    }

    private List<AiGeneratedQuestion> generateFallbackQuestions(String topic, String difficulty, int count) {
        List<AiGeneratedQuestion> list = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            AiGeneratedQuestion q = new AiGeneratedQuestion();
            q.setQuestion("What is a core principle of " + topic + " (" + difficulty + " Level) - Question #" + i + "?");
            q.setOptionA("Optimizing execution speed and modular architecture");
            q.setOptionB("Synchronous single-threaded blocking operations");
            q.setOptionC("Manual garbage collection with manual pointers");
            q.setOptionD("Deprecating legacy interfaces without backwards compatibility");
            q.setCorrectOption("A");
            list.add(q);
        }
        return list;
    }
}