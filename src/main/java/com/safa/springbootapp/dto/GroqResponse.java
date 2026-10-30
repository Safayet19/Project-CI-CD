package com.safa.springbootapp.dto;

import java.util.List;

public record GroqResponse(List<GroqChoice> choices) {}
