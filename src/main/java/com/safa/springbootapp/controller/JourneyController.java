package com.safa.springbootapp.controller;

import com.safa.springbootapp.service.AcademicJourneyService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class JourneyController {
    private final AcademicJourneyService academicJourneyService;

    public JourneyController(AcademicJourneyService academicJourneyService) {
        this.academicJourneyService = academicJourneyService;
    }

    @GetMapping({"/journey", "/academic-journey"})
    public String journey(Model model) {
        model.addAttribute("activePage", "journey");
        model.addAttribute("journey", academicJourneyService.journey());
        return "journey";
    }

    @GetMapping("/training-certifications")
    public String training(Model model) {
        model.addAttribute("activePage", "training");
        return "certifications";
    }
}
