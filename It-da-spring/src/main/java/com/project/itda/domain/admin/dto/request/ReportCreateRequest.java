package com.project.itda.domain.admin.dto.request;

import com.project.itda.domain.admin.enums.ReportedType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReportCreateRequest {

    @NotNull(message = "신고 대상 유형은 필수입니다")
    private ReportedType reportedType;

    @NotNull(message = "신고 대상 ID는 필수입니다")
    private Long reportedId;

    @NotBlank(message = "신고 사유는 필수입니다")
    @Size(max = 100, message = "신고 사유는 100자를 초과할 수 없습니다")
    private String reason;

    private String description;
}