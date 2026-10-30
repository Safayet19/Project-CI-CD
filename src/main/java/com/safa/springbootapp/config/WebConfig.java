package com.safa.springbootapp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.ResourceUrlEncodingFilter;
import org.springframework.web.servlet.resource.VersionResourceResolver;

import java.time.Duration;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
            .addResourceLocations("classpath:/META-INF/resources/", "classpath:/resources/",
                "classpath:/static/", "classpath:/public/")
            .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
            .resourceChain(true)
            .addResolver(new VersionResourceResolver().addContentVersionStrategy("/**"));
    }

    @Bean
    ResourceUrlEncodingFilter resourceUrlEncodingFilter() {
        return new ResourceUrlEncodingFilter();
    }
}
