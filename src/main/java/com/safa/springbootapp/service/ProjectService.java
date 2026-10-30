package com.safa.springbootapp.service;

import com.safa.springbootapp.model.Project;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.InputStream;
import java.util.List;

/** The project collection and all case studies share a single data model and view. */
@Service
public class ProjectService {
    private static final List<Project> PROJECTS = loadProjects();

    private static List<Project> loadProjects() {
        try (InputStream input = ProjectService.class.getResourceAsStream("/content/projects.json")) {
            if (input == null) throw new IllegalStateException("Missing project catalog");
            return List.copyOf(new ObjectMapper().readValue(input, new TypeReference<List<Project>>() {}));
        } catch (Exception error) {
            throw new IllegalStateException("Cannot load structured project content", error);
        }
    }

    public List<Project> projects() {
        return PROJECTS;
    }

    public Project project(String slug) {
        return PROJECTS.stream().filter(item -> item.slug().equals(slug))
            .findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }
}
