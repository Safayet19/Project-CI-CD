package com.safa.springbootapp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;

/** One public route family and one structured, reusable learning catalog. */
@Controller
public class LearningController {
    public record Evidence(String image, String title, String caption) {}
    public record Command(String label, String code) {}
    public record ExplanationItem(String term, String explanation) {}
    // Optional practical blocks let courses place original code and POC images beside each step.
    // Existing DVWA lessons continue using their original fields and rendering flow.
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
    public record Course(String slug, String category, String icon, String title,
                         String description, List<Lesson> modules) {
        public long getAvailableCount() { return modules.stream().filter(Lesson::isAvailable).count(); }
        public long getUpcomingCount() { return modules.size() - getAvailableCount(); }
    }

    private static final List<Course> COURSES = loadCourses();

    private static List<Course> loadCourses() {
        try (InputStream input = LearningController.class.getResourceAsStream("/content/learning-tracks.json")) {
            if (input == null) throw new IllegalStateException("Missing learning catalog");
            return List.copyOf(new ObjectMapper().readValue(input, new TypeReference<List<Course>>() {}));
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured learning content", error);
        }
    }

    private static Course course(String slug) {
        return COURSES.stream().filter(item -> item.slug().equals(slug) && !item.modules().isEmpty())
            .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    private static List<Course> catalogCourses() {
        return List.of(
            course("java-programming"),
            new Course("advanced-java-spring-boot", "Backend Development", "code",
                "Advanced Java Programming with Spring Boot",
                "Advanced Java, Spring Boot, REST APIs, Spring Security, databases, and practical backend development.",
                List.of()),
            course("practical-devops"),
            course("dvwa")
        );
    }

    @GetMapping("/learning")
    public String catalog(Model model) {
        model.addAttribute("activePage", "learning");
        List<Course> catalogCourses = catalogCourses();
        model.addAttribute("courses", catalogCourses);
        model.addAttribute("categories", java.util.stream.Stream.concat(
            catalogCourses.stream().map(Course::category), java.util.stream.Stream.of("Academic"))
            .distinct().toList());
        return "learning";
    }

    @GetMapping("/learning/{track}")
    public String overview(@PathVariable("track") String track, Model model) {
        Course course = course(track);
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", course);
        return "dvwa";
    }

    @GetMapping("/learning/{track}/{slug}")
    public String lesson(@PathVariable("track") String track, @PathVariable("slug") String slug, Model model) {
        Course course = course(track);
        int index = -1;
        for (int i = 0; i < course.modules().size(); i++) {
            if (course.modules().get(i).slug().equals(slug)) { index = i; break; }
        }
        if (index == -1 || !course.modules().get(index).isAvailable())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not available");
        Lesson previous = null;
        Lesson next = null;
        for (int i = index - 1; i >= 0; i--) {
            if (course.modules().get(i).isAvailable()) { previous = course.modules().get(i); break; }
        }
        for (int i = index + 1; i < course.modules().size(); i++) {
            if (course.modules().get(i).isAvailable()) { next = course.modules().get(i); break; }
        }
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", course);
        model.addAttribute("lesson", course.modules().get(index));
        model.addAttribute("lessonIndex", index);
        model.addAttribute("previous", previous);
        model.addAttribute("next", next);
        return "dvwa-detail";
    }
}
