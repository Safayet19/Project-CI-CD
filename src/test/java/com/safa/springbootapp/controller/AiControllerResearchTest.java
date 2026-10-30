package com.safa.springbootapp.controller;

import com.safa.springbootapp.dto.ChatRequest;
import com.safa.springbootapp.dto.ChatTurn;
import com.safa.springbootapp.dto.ErrorResponse;
import com.safa.springbootapp.dto.SitePage;
import com.safa.springbootapp.dto.VerifiedLink;
import com.safa.springbootapp.service.AiRateLimitService;
import com.safa.springbootapp.service.AiService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AiControllerResearchTest {
    @Test
    void derivesPaperCountsAuthorPositionsAndLinksFromResearchPage() {
        String knowledge = AiService.researchKnowledge();

        assertTrue(knowledge.contains("Total papers: 6; Published: 2; Accepted: 4; Pending/Under Review: 0 (none recorded)"));
        assertTrue(knowledge.contains("Safayet Ullah is first author on 3 paper(s)"));
        assertTrue(knowledge.contains("Safayet is 2nd author."));
        assertTrue(knowledge.contains("Safayet is first author."));
        assertTrue(knowledge.contains("10.1109/TENSYMP68909.2026.11704048"));
        assertTrue(knowledge.contains("10.18034/apjee.v9i2.765"));
        assertTrue(knowledge.contains("ACCEPTED"));
        assertTrue(knowledge.contains("PUBLISHED"));
    }

    @Test
    void listsAllResearchPapersGroupedWithAccurateDetails() {
        String reply = AiService.researchReply("Show all research papers.");

        assertTrue(reply.contains("## Published (2)"));
        assertTrue(reply.contains("## Accepted (4)"));
        assertTrue(reply.contains("## Pending/Under Review (0)"));
        assertTrue(reply.contains("1. **An Explainable Stacking Ensemble Framework with Disagreement-Aware Feature Selection for Loan Approval Prediction**"));
        assertTrue(reply.contains("**Status:** Published; **Venue:** IEEE TENSYMP 2026; **Year:** 2026; **Safayet Ullah:** 2nd author"));
        assertTrue(reply.contains("[DOI](https://doi.org/10.1109/TENSYMP68909.2026.11704048)"));
        assertTrue(reply.contains("4. **Reliable Kidney CT Classification via Near Duplicate Slice Auditing and Cluster-disjoint Evaluation**"));
        assertTrue(!reply.contains("**Status:** Under Review"));
    }

    @Test
    void statusSpecificRequestsOnlyIncludeThatCategory() {
        String acceptedReply = AiService.researchReply("Show accepted papers.");
        String publishedReply = AiService.researchReply("List published papers.");
        String pendingReply = AiService.researchReply("Show under-review papers.");

        assertTrue(acceptedReply.startsWith("## Accepted (4)"));
        assertTrue(!acceptedReply.contains("## Published"));
        assertTrue(!acceptedReply.contains("## Pending/Under Review"));
        assertTrue(publishedReply.startsWith("## Published (2)"));
        assertTrue(!publishedReply.contains("## Accepted"));
        assertTrue(pendingReply.startsWith("## Pending/Under Review (0)"));
        assertTrue(!pendingReply.contains("## Published"));
        assertTrue(!pendingReply.contains("## Accepted"));
    }

    @Test
    void researchSuggestionGetsPaperRecordsWithoutGroqConfiguration() {
        AiController controller = controller();

        var response = controller.chat(new ChatRequest("Show all research papers by Safayet Ullah.", null),
            requestFrom("192.0.2.10"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void reportsUnavailableGroqAndRejectsUnverifiedLinks() {
        AiController controller = controller();
        var fallback = controller.chat(new ChatRequest("Explain a tutorial not on the site.", null),
            requestFrom("192.0.2.10"));
        var invalidContext = controller.chat(new ChatRequest("Explain this page.", null, "/",
                List.of(new SitePage("/", "Home", "Visible page text.")),
                List.of(new VerifiedLink("External", "https://example.com"))),
            requestFrom("192.0.2.11"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, fallback.getStatusCode());
        assertEquals("AI service is not configured",
            ((ErrorResponse) fallback.getBody()).error());
        assertEquals(HttpStatus.BAD_REQUEST, invalidContext.getStatusCode());
    }

    @Test
    void includesDynamicPageContentAndCurrentPageInModelContext() {
        String context = AiService.systemContext(new ChatRequest("Explain this lesson.", null,
            "/learning/example", List.of(new SitePage(
                "/learning/example", "Published lesson", "Actual lesson text.")),
            List.of(new VerifiedLink("Learning Hub", "/learning"))));

        assertTrue(context.contains("CURRENT PAGE: /learning/example"));
        assertTrue(context.contains("AUTHORITATIVE PUBLIC WEBSITE RECORDS"));
        assertFalse(context.contains("Published lesson"));
        assertFalse(context.contains("Actual lesson text."));
        assertTrue(context.contains("Learning Hub: /learning"));
    }

    @Test
    void includesCompleteResearchRecordsOnlyForRelevantListRequests() {
        var page = new SitePage("/research", "Research", "Raw research page text.");
        var allPapers = new ChatRequest("Show all research papers.", null, "/research",
            List.of(page), List.of());
        var unrelatedFollowUp = new ChatRequest("What is his CGPA?",
            List.of(new ChatTurn("user", "Show all research papers.")),
            "/research", List.of(page), List.of());

        String researchContext = AiService.systemContext(allPapers);
        String cgpaContext = AiService.systemContext(unrelatedFollowUp);

        assertTrue(researchContext.contains("VERIFIED PUBLIC RESEARCH RECORDS"));
        assertTrue(researchContext.contains("Total papers: 6"));
        assertFalse(researchContext.contains("Raw research page text."));
        assertFalse(cgpaContext.contains("CALCULATED RESEARCH RECORDS FROM THE RESEARCH PAGE"));
        assertTrue(cgpaContext.contains("CGPA: 3.99 / 4.00"));
    }

    @Test
    void distinguishesWebsiteOwnerFromBotIdentity() {
        String context = AiService.systemContext(new ChatRequest("Who is safate?", null));

        assertTrue(context.contains("introduce Safayet Ullah"));
        assertTrue(context.contains("Briefly introduce Safayet Bot only"));
        assertTrue(context.contains("do not introduce the chatbot"));
        assertTrue(context.contains("balanced profile"));
        assertTrue(context.contains("university CGPA"));
        assertTrue(context.contains("HSC and SSC GPA"));
    }

    @Test
    void instructsModelToUnderstandAndLocalizeBanglaBanglishAndFollowUps() {
        String context = AiService.systemContext(new ChatRequest("tui k", List.of(
            new ChatTurn("user", "Safayet er project gula bolo"),
            new ChatTurn("assistant", "O kichu verified project build koreche."))));

        assertTrue(context.contains("Bangla (Bengali script)"));
        assertTrue(context.contains("Banglish (Bangla written in the Latin alphabet)"));
        assertTrue(context.contains("natural Romanized Bangla to Banglish"));
        assertTrue(context.contains("whole utterance instead of requiring exact keywords"));
        assertTrue(context.contains("grammatical and semantic roles"));
        assertTrue(context.contains("Safayet ke?"));
        assertTrue(context.contains("সাফায়েত কে?"));
        assertTrue(context.contains("Do not ask for clarification or refuse merely"));
        assertTrue(context.contains("Treat informal teasing or profanity as tone"));
        assertTrue(context.contains("Carry the established language naturally through short or ambiguous follow-ups"));
    }

    @Test
    void distinguishesVisitorRecognitionFromBotIdentityAndPrioritizesCorrections() {
        String context = AiService.systemContext(new ChatRequest(
            "ami bolsi amake chinos??", List.of(
                new ChatTurn("user", "amake chinos?"),
                new ChatTurn("assistant", "I'm Safayet Bot, the website assistant."))));

        assertTrue(context.contains("First-person forms such as I, me, my"));
        assertTrue(context.contains("ami, amake, amar"));
        assertTrue(context.contains("it is not automatically a bot-identity question"));
        assertTrue(context.contains("cannot personally know, recognize, authenticate, or identify"));
        assertTrue(context.contains("Do not claim recognition"));
        assertTrue(context.contains("redirect such a question to Safayet Ullah"));
        assertTrue(context.contains("Treat the latest user message as the primary request"));
        assertTrue(context.contains("may be a misunderstanding, not a fact"));
        assertTrue(context.contains("directly answer the corrected or repeated question"));
    }

    @Test
    void acceptsValidWebsitePagesWhenLinksAreMissing() {
        AiController controller = controller();
        var response = controller.chat(new ChatRequest("Explain this page.", null,
                "/about", List.of(new SitePage(
                    "/about", "About", "Safayet's public profile.")), null),
            requestFrom("192.0.2.12"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    }

    @Test
    void excludesUnrelatedVerifiedLinksFromCasualConversationContext() {
        var request = new ChatRequest("hi", null, "/",
            List.of(new SitePage("/", "Home", "Portfolio introduction.")),
            List.of(new VerifiedLink("Research paper DOI", "https://doi.org/10.1234/example"),
                new VerifiedLink("Projects", "/projects")));

        String context = AiService.systemContext(request);

        assertFalse(context.contains("https://doi.org/10.1234/example"));
        assertFalse(context.contains("VERIFIED PUBLIC LINKS"));
    }

    @Test
    void acceptsOnlyContactLinksPublishedByTheWebsite() {
        AiController controller = controller();
        var page = List.of(new SitePage("/", "Home", "Public Contact section."));
        var publicContact = controller.chat(new ChatRequest("How can I contact Safayet?", null, "/",
                page, List.of(
                    new VerifiedLink("Email", "mailto:safayetullah019@gmail.com"),
                    new VerifiedLink("WhatsApp", "https://wa.me/8801837945824"))),
            requestFrom("192.0.2.13"));
        var unverifiedContact = controller.chat(new ChatRequest("How can I contact Safayet?", null, "/",
                page, List.of(new VerifiedLink("Phone", "https://wa.me/8801000000000"))),
            requestFrom("192.0.2.14"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, publicContact.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, unverifiedContact.getStatusCode());
    }

    private static AiController controller() {
        return new AiController(new AiService(""), new AiRateLimitService(List.of("127.0.0.1")));
    }

    private static MockHttpServletRequest requestFrom(String address) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(address);
        return request;
    }
}
