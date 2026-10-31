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
    private static final List<MonitoringSubmodule> MONITORING_SUBMODULES = List.of(
        new MonitoringSubmodule("monitoring-fundamentals", "01", "Monitoring Fundamentals",
            "Understand monitoring, observability, Prometheus, Grafana, and the complete metrics flow.", 1, 3),
        new MonitoringSubmodule("metrics-collection", "02", "Metrics Collection with Prometheus",
            "Prepare Spring Boot, configure Prometheus, and query the recorded application metrics.", 4, 6),
        new MonitoringSubmodule("grafana-dashboards", "03", "Grafana & Dashboard Visualization",
            "Connect Grafana to Prometheus and build a clear, useful monitoring dashboard.", 7, 8),
        new MonitoringSubmodule("grafana-alerting", "04", "Grafana Alerting & Application Health",
            "Understand Grafana alert states and verify the existing Application Down rule.", 9, 10),
        new MonitoringSubmodule("slack-troubleshooting", "05", "Slack Integration & Troubleshooting",
            "Deliver automatic Slack notifications and review troubleshooting, security, and limitations.", 11, 12)
    );
    private static final List<String> MONITORING_CHAPTER_TITLES = List.of(
        "Introduction to Monitoring & Observability",
        "Understanding Prometheus",
        "Understanding Grafana & Monitoring Architecture",
        "Preparing Spring Boot",
        "Installing and Configuring Prometheus",
        "Understanding and Querying Metrics",
        "Installing and Connecting Grafana",
        "Building the Monitoring Dashboard",
        "Understanding Grafana Alerts",
        "Application Down Alert",
        "Slack Integration and Automatic Notifications",
        "Troubleshooting, Security & Final Review"
    );

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

    public List<MonitoringSubmodule> monitoringSubmodules() {
        return MONITORING_SUBMODULES;
    }

    public MonitoringNavigation monitoringSubmodule(String track, String moduleSlug, String submoduleSlug) {
        if (!"practical-devops".equals(track) || !"prometheus-grafana".equals(moduleSlug))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitoring submodule not found");

        LessonNavigation module = lesson(track, moduleSlug);
        int index = -1;
        for (int i = 0; i < MONITORING_SUBMODULES.size(); i++) {
            if (MONITORING_SUBMODULES.get(i).slug().equals(submoduleSlug)) { index = i; break; }
        }
        if (index == -1)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitoring submodule not found");

        MonitoringSubmodule selected = MONITORING_SUBMODULES.get(index);
        List<MonitoringChapter> chapters = java.util.stream.IntStream
            .rangeClosed(selected.firstChapter(), selected.lastChapter())
            .mapToObj(number -> new MonitoringChapter(
                number,
                MONITORING_CHAPTER_TITLES.get(number - 1),
                module.lesson().practicalSteps().get(number - 1)))
            .toList();
        MonitoringSubmodule previous = index > 0 ? MONITORING_SUBMODULES.get(index - 1) : null;
        MonitoringSubmodule next = index + 1 < MONITORING_SUBMODULES.size() ? MONITORING_SUBMODULES.get(index + 1) : null;
        return new MonitoringNavigation(module, selected, index, chapters, previous, next);
    }

    public record LessonNavigation(LearningCourse course, Lesson lesson, int lessonIndex,
                                   Lesson previous, Lesson next) {}
    public record MonitoringSubmodule(String slug, String number, String title, String description,
                                      int firstChapter, int lastChapter) {
        public int chapterCount() { return lastChapter - firstChapter + 1; }
    }
    public record MonitoringChapter(int number, String title, LearningCourse.PracticalStep content) {}
    public record MonitoringNavigation(LessonNavigation module, MonitoringSubmodule selected,
                                       int selectedIndex, List<MonitoringChapter> chapters,
                                       MonitoringSubmodule previous, MonitoringSubmodule next) {}
}
