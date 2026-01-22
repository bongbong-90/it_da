package com.project.itda.domain.social.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BillRequest {
    private Long totalAmount;
    private Integer participantCount;
    private String account;
    private Long amountPerPerson; // 서버 혹은 클라이언트에서 계산된 값
}