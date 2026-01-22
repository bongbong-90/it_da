package com.project.itda.global.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    // WebConfig 설정과 일치하는 상대 경로 사용
    private final String uploadDir = "src/main/resources/static/uploads/";

    public String storeFile(MultipartFile file) throws IOException {
        // 1. 저장 디렉토리 생성
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        // 2. 파일명 생성 (UUID_파일명 형식으로 중복 방지)
        String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path targetLocation = Paths.get(uploadDir).resolve(fileName);

        // 3. 파일 물리적 저장
        file.transferTo(targetLocation.toFile());

        // 4. DB에 저장될 접근 URL 반환 (WebConfig 매핑 기준)
        return "/uploads/" + fileName;
    }
}