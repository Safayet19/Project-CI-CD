package com.safa.springbootapp.model;

import java.util.List;

public record LearningCourse(String slug, String category, String icon, String title,
                             String description, List<Lesson> modules) {
    public long getAvailableCount() { return modules.stream().filter(Lesson::isAvailable).count(); }
    public long getUpcomingCount() { return modules.size() - getAvailableCount(); }

    public record Evidence(String image, String title, String caption) {}
    public record Command(String label, String code) {}
    public record ExplanationItem(String term, String explanation) {}
    public record PracticalBlock(String kind, String label, String text, String image,
                                 String caption, List<List<String>> rows,
                                 String title, List<ExplanationItem> items) {}
    public record PracticalStep(String title, List<PracticalBlock> blocks) {}
    public record Lesson(String slug, String title, String concept, String objective,
                         List<String> prerequisites, List<String> steps, List<Command> commands,
                         List<Evidence> evidence, String observations, String findings,
                         List<String> prevention, Boolean comingSoon,
                         List<PracticalStep> practicalSteps, List<String> problems,
                         String finalOutcome,
                         List<String> conceptOverview, String whyItMatters,
                         String realLifeExample, List<ExplanationItem> coreIdeas,
                         List<String> learningTakeaways) {
        public boolean isAvailable() { return !Boolean.TRUE.equals(comingSoon); }
    }
}
