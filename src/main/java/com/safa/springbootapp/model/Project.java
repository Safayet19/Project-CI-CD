package com.safa.springbootapp.model;

import java.util.List;

public record Project(String slug, String title, String category, String summary,
                      String cardSummary,
                      List<String> technologies, String thumbnail, List<Screenshot> screenshots,
                      String overview, String purpose, List<String> features, String architecture,
                      List<String> challenges, String repository, String demo,
                      List<RelatedLink> relatedLearning) {
    public record Screenshot(String image, String caption) {}
    public record RelatedLink(String title, String url) {}
}
