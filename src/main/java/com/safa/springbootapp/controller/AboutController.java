package com.safa.springbootapp.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class AboutController {
    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("activePage", "about");
        model.addAttribute("cvAvailable", new ClassPathResource("static/files/Safayet_Ullah_CV.pdf").exists());
        return "about";
    }
}
