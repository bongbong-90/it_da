package com.project.itda.domain.ai.service;

import com.project.itda.global.config.KakaoMapConfig;
import com.project.itda.domain.ai.dto.response.KakaoSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;

/**
 * 카카오맵 API 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class KakaoMapService {

    private final RestTemplate restTemplate;
    private final KakaoMapConfig kakaoMapConfig;

    private static final String KAKAO_SEARCH_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

    /**
     * 키워드로 장소 검색
     *
     * @param category 검색 카테고리 (예: "카페", "식당")
     * @param latitude 중간지점 위도
     * @param longitude 중간지점 경도
     * @param radius 검색 반경 (m)
     * @return 장소 목록
     */
    public List<KakaoSearchResponse.KakaoPlace> searchPlaces(
            String category,
            Double latitude,
            Double longitude,
            Integer radius
    ) {
        try {
            log.info("🗺️ 카카오맵 검색 - category: {}, lat: {}, lng: {}, radius: {}m",
                    category, latitude, longitude, radius);

            // URL 생성
            String url = UriComponentsBuilder.fromHttpUrl(KAKAO_SEARCH_URL)
                    .queryParam("query", category)
                    .queryParam("x", longitude)
                    .queryParam("y", latitude)
                    .queryParam("radius", radius)
                    .queryParam("sort", "distance")  // 거리순 정렬
                    .queryParam("size", kakaoMapConfig.getMap().getSearch().getSize())
                    .build()
                    .toUriString();

            // 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "KakaoAK " + kakaoMapConfig.getRestApiKey());

            HttpEntity<String> entity = new HttpEntity<>(headers);

            // API 호출
            ResponseEntity<KakaoSearchResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    entity,
                    KakaoSearchResponse.class
            );

            if (response.getBody() != null && response.getBody().getDocuments() != null) {
                log.info("✅ 카카오맵 검색 성공 - 결과: {}개",
                        response.getBody().getDocuments().size());
                return response.getBody().getDocuments();
            }

            log.warn("⚠️ 카카오맵 검색 결과 없음");
            return Collections.emptyList();

        } catch (Exception e) {
            log.error("❌ 카카오맵 API 호출 실패: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }
}