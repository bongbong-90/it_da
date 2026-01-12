package com.project.itda.domain.review.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 후기 수정 요청
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReviewUpdateRequest {

    /**
     * 평점 (1~5)
     */
    @NotNull(message = "평점은 필수입니다")
    @Min(value = 1, message = "평점은 1점 이상이어야 합니다")
    @Max(value = 5, message = "평점은 5점 이하여야 합니다")
    private Integer rating;

    /**
     * 후기 내용
     */
    @NotBlank(message = "후기 내용은 필수입니다")
    @Size(min = 10, max = 500, message = "후기는 10자 이상 500자 이하로 작성해주세요")
    private String reviewText;

    /**
     * 공개 여부
     */
    @NotNull(message = "공개 여부는 필수입니다")
    private Boolean isPublic;
}