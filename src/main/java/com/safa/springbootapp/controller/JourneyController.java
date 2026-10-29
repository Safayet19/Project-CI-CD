package com.safa.springbootapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;

@Controller
public class JourneyController {
    public record University(String name, String degree, String period, String logo, String introduction) {}
    public record Highlight(String label, String value, String note) {}
    public record Course(String code, String name) {}
    public record SemesterProject(String name, String description, String subject, String image, String detailUrl) {}
    public record Memory(String image, String alt, String caption) {}
    public record Semester(int number, String term, String status, List<Course> courses, String learning,
                           List<SemesterProject> projects, List<Memory> memories,
                           List<String> achievements, String reflection) {
        public boolean hasContent() {
            return !courses.isEmpty() || !learning.isBlank() || !projects.isEmpty() || !memories.isEmpty()
                || !achievements.isEmpty() || !reflection.isBlank();
        }
    }
    public record AcademicYear(int number, String label, List<Semester> semesters) {}
    public record PreviousEducation(String institution, String qualification, String period,
                                    String result, String logo) {}
    public record AcademicJourney(University university, List<Highlight> highlights,
                                  List<AcademicYear> years, List<PreviousEducation> beforeUniversity) {}

    private static final AcademicJourney ACADEMIC_JOURNEY = loadAcademicJourney();

    private static AcademicJourney loadAcademicJourney() {
        try (InputStream input = JourneyController.class.getResourceAsStream("/content/academic-journey.json")) {
            if (input == null) throw new IllegalStateException("Missing academic journey content");
            return new ObjectMapper().readValue(input, AcademicJourney.class);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured academic journey content", error);
        }
    }

    @GetMapping({"/journey", "/academic-journey"})
    public String journey(Model model) {
        model.addAttribute("activePage", "journey");
        model.addAttribute("journey", ACADEMIC_JOURNEY);
        return "journey";
    }

    @GetMapping("/training-certifications")
    public String training(Model model) {
        model.addAttribute("activePage", "training");
        return "certifications";
    }
}
