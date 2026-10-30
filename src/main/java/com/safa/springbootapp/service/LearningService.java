package com.safa.springbootapp.service;

import com.safa.springbootapp.model.LearningCourse;
import com.safa.springbootapp.model.LearningCourse.Lesson;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;

/** One public route family and one structured, reusable learning catalog. */
@Service
public class LearningService {
    private static final List<LearningCourse> COURSES = loadCourses();

    private static List<LearningCourse> loadCourses() {
        try (InputStream input = LearningService.class.getResourceAsStream("/content/learning-tracks.json")) {
            if (input == null) throw new IllegalStateException("Missing learning catalog");
            return List.copyOf(new ObjectMapper().readValue(input, new TypeReference<List<LearningCourse>>() {}));
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured learning content", error);
        }
    }

    public LearningCourse course(String slug) {
        return COURSES.stream().filter(item -> item.slug().equals(slug) && !item.modules().isEmpty())
            .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found"));
    }

    public List<LearningCourse> catalogCourses() {
        return List.of(
            course("java-programming"),
            course("advanced-java-spring-boot"),
            course("practical-devops"),
            course("dvwa")
        );
    }

    public LessonNavigation lesson(String track, String slug) {
        LearningCourse course = course(track);
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
        return new LessonNavigation(course, course.modules().get(index), index, previous, next);
    }

    public record LessonNavigation(LearningCourse course, Lesson lesson, int lessonIndex,
                                   Lesson previous, Lesson next) {}
}
