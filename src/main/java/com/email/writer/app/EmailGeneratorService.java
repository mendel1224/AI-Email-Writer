package com.email.writer.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {

    // WebClient instance to handle HTTP requests
    private final WebClient webClient;

    // Injected API URL from application properties
    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    // Injected API Key from application properties
    @Value("${gemini.api.key}")
    private String geminiApiKey;

    // Constructor injection of WebClient builder
    public EmailGeneratorService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    // Main method to generate an email reply based on an incoming email request
    public String generateEmailReply(EmailRequest emailRequest) {

        // Build the prompt text using user input and tone
        String prompt = buildPrompt(emailRequest, "default");

        // Construct the request body as per the Gemini API's expected format
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[] {
                        Map.of("parts", new Object[] {
                                Map.of("text", prompt)
                        })
                }
        );

        // Make a POST request to Gemini API and retrieve the response as a string
        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey) // Full URL with API key
                .header("Content-Type", "application/json")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block(); // Block to get the synchronous response

        // Extract the useful content from the raw response and return it
        return extractResponseContent(response);
    }

    // Helper method to parse the Gemini API's JSON response and extract the generated email
    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response); // Parse the JSON string
            return rootNode.path("candidates")
                    .get(0) // First candidate
                    .path("content")
                    .path("parts")
                    .get(0) // First part of the content
                    .path("text") // Get the text content
                    .asText();
        } catch (Exception e) {
            // Return an error message if something goes wrong while parsing
            return "Error Processing Request: " + e.getMessage();
        }
    }

    // Helper method to construct a prompt string based on input and tone
    private String buildPrompt(EmailRequest emailRequest, String tone) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Generate a professional email reply for the following email content. ")
                .append("Don't generate a subject line or mention one at all. Just include the email itself");

        // If a tone is provided, add it to the prompt
        if (emailRequest.getEmailTone() != null && !emailRequest.getEmailTone().isEmpty()) {
            prompt.append(" Use a ").append(emailRequest.getEmailTone()).append(" tone.");
        }

        // Append the original email content to the prompt
        prompt.append("\nOriginal email: \n").append(emailRequest.getEmailContent());
        return prompt.toString();
    }
}
