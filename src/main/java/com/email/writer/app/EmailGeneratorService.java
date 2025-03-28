package com.email.writer.app;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    public EmailGeneratorService(WebClient.Builder webClientBuilder)
        {
            this.webClient = webClientBuilder.build();
        }

    public String generateEmailReply(EmailRequest emailRequest)
        {


            // Build the prompt
            String prompt = buildPrompt(emailRequest, "default");

            // Craft a request
            Map<String, Object> requestBody = Map.of(
                    "contents", new Object[] {
                            Map.of("parts", new Object[] {
                                Map.of("text", prompt)
                    })

                    }

            );


            // Do request and get response
            String response = webClient.post()
                    .uri(geminiApiUrl + geminiApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();



            // Extract response and return
            return extractResponseContent(response);
        }

    private String extractResponseContent(String response)
        {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode rootNode = mapper.readTree(response);
                return rootNode.path("candidates")
                        .get(0)
                        .path("content")
                        .path("parts")
                        .get(0)
                        .path("text")
                        .asText();
            }
            catch (Exception e) {
                return "Error Processing Request: " + e.getMessage();
            }
        }


    private String buildPrompt(EmailRequest emailRequest, String tone)
        {
            StringBuilder prompt = new StringBuilder();
            prompt.append("Generate a professional email reply for the following email content. Don't generate a subject line or mention one at all. Just include the email itself");

            if (emailRequest.getEmailTone() != null && !emailRequest.getEmailTone().isEmpty()) // Apply tone to email
            {
                prompt.append("Use a ").append(emailRequest.getEmailTone()).append(" tone.");
            }
            prompt.append("\nOriginal email: \n").append(emailRequest.getEmailContent());
            return prompt.toString();
        }
}
