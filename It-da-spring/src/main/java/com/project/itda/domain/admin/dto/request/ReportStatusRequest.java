package com.project.itda.domain.admin.dto.request;

import com.project.itda.domain.admin.enums.ReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
public class ReportStatusRequest {

    @NotNull(message = "처리 상태는 필수입니다")
    private ReportStatus status;

    private String adminNote;
}