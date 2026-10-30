package com.safa.springbootapp.dto;

import java.util.List;

public record GroqRequest(String model, List<GroqMessage> messages) {}
