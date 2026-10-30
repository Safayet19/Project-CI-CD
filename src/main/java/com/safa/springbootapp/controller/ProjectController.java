package com.safa.springbootapp.controller;

import com.safa.springbootapp.model.Project;
import com.safa.springbootapp.service.ProjectService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/projects")
    public String gallery(Model model) {
        model.addAttribute("activePage", "projects");
        model.addAttribute("projects", projectService.projects());
        model.addAttribute("categories", projectService.projects().stream()
            .map(Project::category).distinct().toList());
        return "projects";
    }

    @GetMapping("/projects/{slug}")
    public String caseStudy(@PathVariable("slug") String slug, Model model) {
        model.addAttribute("activePage", "projects");
        model.addAttribute("project", projectService.project(slug));
        return "project-detail";
    }
}
