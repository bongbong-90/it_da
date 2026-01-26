package com.project.itda.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir}")
    private String uploadDir; // application.properties의 설정을 가져옴

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // OS에 상관없이 동작하도록 설정 (파일 프로토콜 추가)
        String location = "file:" + Paths.get(uploadDir).toAbsolutePath().toString() + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(0);
    }
}