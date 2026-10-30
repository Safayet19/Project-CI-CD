package com.safa.springbootapp.dto;

import java.util.List;

public record ChatRequest(String message, List<ChatTurn> history, String pagePath,
                          List<SitePage> pages, List<VerifiedLink> links) {
    public ChatRequest(String message, List<ChatTurn> history) {
        this(message, history, null, null, null);
    }
}
