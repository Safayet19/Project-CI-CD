package com.safa.springbootapp.model;

import java.util.List;

public record AcademicJourney(University university, List<Highlight> highlights,
                              List<AcademicYear> years, List<PreviousEducation> beforeUniversity) {
    public record University(String name, String degree, String period, String logo, String introduction) {}
    public record Highlight(String label, String value, String note) {}
    public record Course(String code, String name, int credits, String gradePoint, String grade) {}
    public record SemesterProject(String name, String description, String subject, String image, String detailUrl) {}
    public record Memory(String image, String alt, String caption) {}
    public record Semester(int number, String term, String status, String gpa, int completedCredits,
                           List<Course> courses, String learning,
                           List<SemesterProject> projects, List<Memory> memories,
                           List<String> achievements, String reflection) {
        public boolean hasContent() {
            return !courses.isEmpty() || !learning.isBlank() || !projects.isEmpty() || !memories.isEmpty()
                || !achievements.isEmpty() || !reflection.isBlank();
        }
    }
    public record AcademicYear(int number, String label, String focus, List<Semester> semesters) {}
    public record PreviousEducation(String institution, String qualification, String period,
                                    String result, String logo) {}
}
