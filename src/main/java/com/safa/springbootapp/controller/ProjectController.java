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

/** The project collection and all case studies share a single data model and view. */
@Controller
public class ProjectController {
    public record Screenshot(String image, String caption) {}
    public record RelatedLink(String title, String url) {}
    public record Project(String slug, String title, String category, String summary,
                          List<String> technologies, String thumbnail, List<Screenshot> screenshots,
                          String overview, String purpose, List<String> features, String architecture,
                          List<String> challenges, String repository, String demo,
                          List<RelatedLink> relatedLearning) {}

    private static final List<Project> PROJECTS = loadProjects();

    private static List<Project> loadProjects() {
        try (InputStream input = ProjectController.class.getResourceAsStream("/content/projects.json")) {
            if (input == null) throw new IllegalStateException("Missing project catalog");
            return List.copyOf(new ObjectMapper().readValue(input, new TypeReference<List<Project>>() {}));
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured project content", error);
        }
    }

    @GetMapping("/projects")
    public String gallery(Model model) {
        model.addAttribute("activePage", "projects");
        model.addAttribute("projects", PROJECTS);
        model.addAttribute("categories", PROJECTS.stream().map(Project::category).distinct().toList());
        return "projects";
    }

    @GetMapping("/projects/{slug}")
    public String caseStudy(@PathVariable("slug") String slug, Model model) {
        Project project = PROJECTS.stream().filter(item -> item.slug().equals(slug))
            .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
        model.addAttribute("activePage", "projects");
        model.addAttribute("project", project);
        return "project-detail";
    }
}
