package com.safa.springbootapp.controller;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AiControllerResearchTest {
    @Test
    void derivesPaperCountsAuthorPositionsAndLinksFromResearchPage() {
        String knowledge = AiController.researchKnowledge();

        assertTrue(knowledge.contains("Total papers: 6; Published: 2; Accepted: 4; Under Review: 0 (none recorded)"));
        assertTrue(knowledge.contains("Safayet Ullah is first author on 3 paper(s)"));
        assertTrue(knowledge.contains("Safayet is 2nd author."));
        assertTrue(knowledge.contains("Safayet is first author."));
        assertTrue(knowledge.contains("10.1109/TENSYMP68909.2026.11704048"));
        assertTrue(knowledge.contains("10.18034/apjee.v9i2.765"));
        assertTrue(knowledge.contains("ACCEPTED"));
        assertTrue(knowledge.contains("PUBLISHED"));
    }
}
