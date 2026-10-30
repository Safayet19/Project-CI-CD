package com.safa.springbootapp.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.mock.web.MockHttpServletRequest;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void selectsRelevantPageExcerptsAndKeepsBalancedProfileSources() {
        String unrelated = "Unrelated archive text. ".repeat(120);
        var focused = new AiController.ChatRequest("What are Safayet's Java project skills?", null, "/",
            List.of(
                new AiController.SitePage("/", "Home", "Personal portfolio introduction. " + unrelated),
                new AiController.SitePage("/about", "About", "Verified technical skills include Java and Spring Boot."),
                new AiController.SitePage("/projects", "Projects", "The Java project demonstrates application development.")
            ), List.of());
        String focusedContext = AiController.systemContext(focused);

        assertTrue(focusedContext.contains("Verified technical skills include Java and Spring Boot."));
        assertTrue(focusedContext.contains("Java project demonstrates application development."));
        assertFalse(focusedContext.contains("Unrelated archive text."));

        var profile = new AiController.ChatRequest("Tell me about Safayet.", null, "/",
            List.of(
                new AiController.SitePage("/", "Home", "Portfolio introduction and purpose."),
                new AiController.SitePage("/about", "About", "Software developer and verified technical skills."),
                new AiController.SitePage("/academic-journey", "Academic Journey", "CGPA and academic standing."),
                new AiController.SitePage("/projects", "Projects", "Selected verified software projects."),
                new AiController.SitePage("/research", "Research", "Research and publication records.")
            ), List.of());
        String profileContext = AiController.systemContext(profile);

        assertTrue(profileContext.contains("Portfolio introduction and purpose."));
        assertTrue(profileContext.contains("verified technical skills."));
        assertTrue(profileContext.contains("CGPA and academic standing."));
        assertTrue(profileContext.contains("verified software projects."));
        assertTrue(profileContext.contains("Research and publication records."));
    }

    @Test
    void boundsRecentHistoryButAlwaysSendsTheCurrentQuestion() {
        var history = List.of(
            new AiController.ChatTurn("user", "old question ".repeat(30)),
            new AiController.ChatTurn("assistant", "old response ".repeat(30)),
            new AiController.ChatTurn("user", "recent question ".repeat(20)),
            new AiController.ChatTurn("assistant", "recent response ".repeat(20)),
            new AiController.ChatTurn("user", "latest context ".repeat(10)),
            new AiController.ChatTurn("assistant", "latest response ".repeat(10)));

        List<AiController.ChatTurn> conversation = AiController.recentHistory(history);

        assertTrue(conversation.size() <= 6);
        assertTrue(conversation.stream().mapToInt(turn -> turn.content().length()).sum() <= 7200);
        List<AiController.GroqMessage> messages = AiController.buildMessages(
            new AiController.ChatRequest("Tell me about his project.", history));
        assertEquals("Tell me about his project.", messages.getLast().content());
    }

    @Test
    void keepsGroqModelAndMessagesInCompatibleRequestJson() throws Exception {
        String request = new ObjectMapper().writeValueAsString(
            new AiController.GroqRequest("openai/gpt-oss-20b", List.of()));

        assertTrue(request.contains("\"model\":\"openai/gpt-oss-20b\""));
        assertTrue(request.contains("\"messages\":[]"));
        assertFalse(request.contains("max_completion_tokens"));
    }

    @Test
    void capsPageSnapshotsInTheConstructedPrompt() {
        List<AiController.SitePage> pages = List.of(
            new AiController.SitePage("/", "Home", "Portfolio introduction. ".repeat(120)),
            new AiController.SitePage("/about", "About", "Profile details. ".repeat(120)),
            new AiController.SitePage("/academic-journey", "Academic Journey", "Education records. ".repeat(120)),
            new AiController.SitePage("/projects", "Projects", "Project records. ".repeat(120)),
            new AiController.SitePage("/research", "Research", "Research records. ".repeat(120)));

        List<AiController.GroqMessage> messages = AiController.buildMessages(
            new AiController.ChatRequest("Tell me about Safayet.", null, "/", pages, List.of()));
        int totalChars = messages.stream().mapToInt(message -> message.content().length()).sum();

        assertTrue(totalChars < 33000);
    }

    @Test
    void retrievesAcademicRecordsFromTheExistingJourneyData() {
        String cgpa = JourneyController.academicKnowledge("What is his current CGPA and batch standing?");
        String summer = JourneyController.academicKnowledge("What happened in Summer 2023 for CSE161?");
        String spring2026 = JourneyController.academicKnowledge("What courses did he take Spring 2026?");
        String summer2026 = JourneyController.academicKnowledge("What was completed in Summer 2026?");
        String completeCourseList = JourneyController.academicKnowledge("What courses did he take?");

        assertTrue(cgpa.contains("CGPA: 3.99 / 4.00"));
        assertTrue(cgpa.contains("Academic Standing: 1st Rank in Batch"));
        assertTrue(summer.contains("CSE161 — Programming Language I (3 credits, 3.75, A)"));
        assertTrue(spring2026.contains("Spring 2026 — Semester 10"));
        assertFalse(spring2026.contains("CSE444"));
        assertTrue(summer2026.contains("CSE444 — Computer Graphics & Animation Lab (1 credit, 4.00, A+)"));
        assertTrue(completeCourseList.contains("Semester 1;"));
        assertTrue(completeCourseList.contains("Semester 11;"));
        assertTrue(completeCourseList.contains("CSE444 — Computer Graphics & Animation Lab (1 credit, 4.00, A+)"));
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
