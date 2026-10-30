package com.safa.springbootapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
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
    void blocksOnlyAutomatedBurstsAndKeepsVisitorsIndependent() {
        AiController controller = new AiController("", List.of("127.0.0.1"));
        for (int attempt = 0; attempt < 20; attempt++) {
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
        for (int attempt = 0; attempt < 20; attempt++) {
            untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.10");
            controller.chat(new AiController.ChatRequest("Hello", null), untrustedRequest);
            untrustedRequest.removeHeader("X-Forwarded-For");
        }
        untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.11");
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
            controller.chat(new AiController.ChatRequest("Hello", null), untrustedRequest).getStatusCode());
    }

    @Test
    void mapsGroqErrorsToUsefulClientStatuses() {
        assertEquals(HttpStatus.BAD_REQUEST,
            AiController.mapGroqError(HttpStatusCode.valueOf(400), "{\"error\":{\"code\":\"invalid_request\"}}")
                .getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST,
            AiController.mapGroqError(HttpStatusCode.valueOf(400),
                "{\"error\":{\"code\":\"context_length_exceeded\"}}").getStatusCode());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
            AiController.mapGroqError(HttpStatusCode.valueOf(401), "").getStatusCode());
        assertEquals(HttpStatus.TOO_MANY_REQUESTS,
            AiController.mapGroqError(HttpStatusCode.valueOf(429), "").getStatusCode());
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE,
            AiController.mapGroqError(HttpStatusCode.valueOf(502), "").getStatusCode());
    }

    @Test
    void rejectsOversizedWebsiteContextAndConversationHistory() {
        AiController controller = new AiController("", List.of("127.0.0.1"));
        MockHttpServletRequest request = requestFrom("192.0.2.10");
        var page = new AiController.SitePage("/", "Home", "x".repeat(14001));
        var oversizedContext = new AiController.ChatRequest("Hello", null, "/",
            List.of(page), List.of());
        var oversizedHistory = new AiController.ChatRequest("Hello",
            java.util.Collections.nCopies(7, new AiController.ChatTurn("user", "Hi")));

        assertEquals(HttpStatus.BAD_REQUEST, controller.chat(oversizedContext, request).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, controller.chat(oversizedHistory, request).getStatusCode());
    }

    @Test
    void normalizesCommonSafayetNameMisspellings() {
        assertEquals("Who is Safayet?", AiController.normalizeKnownNames("Who is safate?"));
        assertEquals("Tell me about Safayet Ullah", AiController.normalizeKnownNames("Tell me about safayte Ullah"));
        assertEquals("What is Safayet Bot?", AiController.normalizeKnownNames("What is Safayet Bot?"));
    }

    @Test
    void normalizesMalformedAiFormatting() {
        String reply = """
            On the About page:

            1.
            ****Category****: Technical Skills<br>
            ****Details****: Java, Spring Boot<br/>Docker
            """;

        assertEquals("""
            On the About page:

            1.
            Technical Skills
            Java, Spring Boot
            Docker""", AiController.normalizeReplyFormatting(reply));
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
