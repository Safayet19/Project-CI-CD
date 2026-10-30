package com.safa.springbootapp.controller;

import com.safa.springbootapp.dto.ChatRequest;
import com.safa.springbootapp.dto.ErrorResponse;
import com.safa.springbootapp.service.AiRateLimitService;
import com.safa.springbootapp.service.AiService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiService aiService;
    private final AiRateLimitService rateLimitService;

    public AiController(AiService aiService, AiRateLimitService rateLimitService) {
        this.aiService = aiService;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping(value = "/chat", consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> chat(@RequestBody(required = false) ChatRequest request,
                                  HttpServletRequest servletRequest) {
        ResponseEntity<?> response;
        if (!rateLimitService.allowRequest(servletRequest)) {
            response = ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponse("Messages are arriving too quickly. Please wait a few seconds and try again."));
        } else {
            response = aiService.chat(request);
        }
        return ResponseEntity.status(response.getStatusCode())
            .headers(response.getHeaders())
            .cacheControl(CacheControl.noStore())
            .body(response.getBody());
    }
}
