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
    public record Lesson(String slug, String title, String concept, String objective,
                         List<String> prerequisites, List<String> steps, List<Command> commands,
                         List<Evidence> evidence, String observations, String findings,
                         List<String> prevention) {}
    public record Course(String slug, String category, String icon, String title,
                         String description, List<Lesson> modules) {}

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

    @GetMapping("/learning")
    public String catalog(Model model) {
        model.addAttribute("activePage", "learning");
        model.addAttribute("courses", COURSES.stream().filter(item -> !item.modules().isEmpty()).toList());
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
        if (index == -1) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lesson not found");
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", course);
        model.addAttribute("lesson", course.modules().get(index));
        model.addAttribute("lessonIndex", index);
        model.addAttribute("previous", index == 0 ? null : course.modules().get(index - 1));
        model.addAttribute("next", index == course.modules().size() - 1 ? null : course.modules().get(index + 1));
        return "dvwa-detail";
    }
}
