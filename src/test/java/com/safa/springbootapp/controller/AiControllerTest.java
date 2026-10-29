package com.safa.springbootapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AiControllerTest {
    @Test
    void enforces500CharacterMessageLimit() {
        AiController controller = new AiController("", List.of("127.0.0.1"));
        MockHttpServletRequest request = requestFrom("192.0.2.10");

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
            controller.chat(new AiController.ChatRequest("a".repeat(500), null), request).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,
            controller.chat(new AiController.ChatRequest("a".repeat(501), null), request).getStatusCode());
    }

    @Test
    void limitsForwardedVisitorsIndependentlyAndIgnoresUntrustedForwardedHeaders() {
        AiController controller = new AiController("", List.of("127.0.0.1"));
        for (int attempt = 0; attempt < 10; attempt++) {
            assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
                controller.chat(new AiController.ChatRequest("Hello", null),
                    forwardedRequest("198.51.100.10")).getStatusCode());
        }
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
            controller.chat(new AiController.ChatRequest("Hello", null),
                forwardedRequest("198.51.100.10")).getStatusCode());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
            controller.chat(new AiController.ChatRequest("Hello", null),
                forwardedRequest("198.51.100.11")).getStatusCode());

        MockHttpServletRequest untrustedRequest = requestFrom("192.0.2.20");
        for (int attempt = 0; attempt < 10; attempt++) {
            untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.10");
            controller.chat(new AiController.ChatRequest("Hello", null), untrustedRequest);
            untrustedRequest.removeHeader("X-Forwarded-For");
        }
        untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.11");
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
            controller.chat(new AiController.ChatRequest("Hello", null), untrustedRequest).getStatusCode());
    }

    private static MockHttpServletRequest forwardedRequest(String clientAddress) {
        MockHttpServletRequest request = requestFrom("127.0.0.1");
        request.addHeader("X-Forwarded-For", clientAddress);
        return request;
    }

    private static MockHttpServletRequest requestFrom(String address) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(address);
        return request;
    }
}
