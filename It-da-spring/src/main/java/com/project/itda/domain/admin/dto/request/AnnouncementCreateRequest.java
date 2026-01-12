package com.project.itda.domain.admin.dto.request;

import com.project.itda.domain.admin.enums.AnnouncementCategory;
import com.project.itda.domain.admin.enums.AnnouncementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class AnnouncementCreateRequest {

    @NotNull(message = "카테고리는 필수입니다")
    private AnnouncementCategory category;

    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자를 초과할 수 없습니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    private Boolean isPinned = false;

    private Boolean isImportant = false;

    @NotNull(message = "상태는 필수입니다")
    private AnnouncementStatus status;

    private LocalDateTime publishedAt;
}