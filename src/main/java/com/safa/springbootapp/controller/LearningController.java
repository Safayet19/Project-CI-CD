package com.safa.springbootapp.controller;

import com.safa.springbootapp.model.LearningCourse;
import com.safa.springbootapp.service.LearningService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
public class LearningController {
    private final LearningService learningService;

    public LearningController(LearningService learningService) {
        this.learningService = learningService;
    }

    @GetMapping("/learning")
    public String catalog(Model model) {
        model.addAttribute("activePage", "learning");
        List<LearningCourse> courses = learningService.catalogCourses();
        model.addAttribute("courses", courses);
        model.addAttribute("categories", java.util.stream.Stream.concat(
            courses.stream().map(LearningCourse::category), java.util.stream.Stream.of("Academic"))
            .distinct().toList());
        return "learning";
    }

    @GetMapping("/learning/{track}")
    public String overview(@PathVariable("track") String track, Model model) {
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", learningService.course(track));
        return "dvwa";
    }

    @GetMapping("/learning/{track}/{slug}")
    public String lesson(@PathVariable("track") String track, @PathVariable("slug") String slug, Model model) {
        LearningService.LessonNavigation navigation = learningService.lesson(track, slug);
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", navigation.course());
        model.addAttribute("lesson", navigation.lesson());
        model.addAttribute("lessonIndex", navigation.lessonIndex());
        model.addAttribute("previous", navigation.previous());
        model.addAttribute("next", navigation.next());
        if ("practical-devops".equals(track) && "prometheus-grafana".equals(slug)) {
            model.addAttribute("submodules", learningService.monitoringSubmodules());
            return "monitoring-overview";
        }
        return "dvwa-detail";
    }

    @GetMapping("/learning/{track}/{slug}/{submodule}")
    public String monitoringSubmodule(@PathVariable("track") String track,
                                      @PathVariable("slug") String slug,
                                      @PathVariable("submodule") String submodule,
                                      Model model) {
        LearningService.MonitoringNavigation navigation =
            learningService.monitoringSubmodule(track, slug, submodule);
        model.addAttribute("activePage", "learning");
        model.addAttribute("course", navigation.module().course());
        model.addAttribute("lesson", navigation.module().lesson());
        model.addAttribute("lessonIndex", navigation.module().lessonIndex());
        model.addAttribute("submodules", learningService.monitoringSubmodules());
        model.addAttribute("submodule", navigation.selected());
        model.addAttribute("submoduleIndex", navigation.selectedIndex());
        model.addAttribute("chapters", navigation.chapters());
        model.addAttribute("previousSubmodule", navigation.previous());
        model.addAttribute("nextSubmodule", navigation.next());
        return "monitoring-submodule";
    }
}
