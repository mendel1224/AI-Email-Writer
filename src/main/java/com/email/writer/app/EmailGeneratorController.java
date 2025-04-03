package com.email.writer.app;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController // Marks this class as a RESTful controller in Spring
@RequestMapping("/api/email") // Base path for all endpoints in this controller
@AllArgsConstructor // Lombok annotation to generate a constructor with all required (final) fields
@CrossOrigin(origins = "*") // Allows cross-origin requests from any domain (useful for frontend/backend on different ports during development)
public class EmailGeneratorController {

    // Injected service responsible for generating the email response
    private final EmailGeneratorService emailGeneratorService;

    // POST endpoint to generate an email reply
    @PostMapping("/generate")
    public ResponseEntity<String> generateEmail(@RequestBody EmailRequest emailRequest) {
        // Call the service to generate the email reply based on the incoming request
        String response = emailGeneratorService.generateEmailReply(emailRequest);

        // Return the generated email in the response body with 200 OK status
        return ResponseEntity.ok(response); // Placeholder for generated email response
    }
}

