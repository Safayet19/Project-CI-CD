package com.safa.springbootapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ResearchController {
    @GetMapping("/research")
    public String research(Model model) {
        model.addAttribute("activePage", "research");
        return "research";
    }
}
