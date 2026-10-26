package com.safa.springbootapp;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WelcomeController {

    @GetMapping("/welcome")
    public ResponseEntity<String> welcome() {
        return ResponseEntity.ok(
                "Welcome! Here we will learn CI/CD with Spring Boot." +
                        "\"CI/CD Automation Test Successful - Version 2\""
        );
    }
}