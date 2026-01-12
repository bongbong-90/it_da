// UserReviewDTO.java (새 파일)
package com.project.itda.domain.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserReviewDTO {
    private Long meetingId;
    private Double rating;
}