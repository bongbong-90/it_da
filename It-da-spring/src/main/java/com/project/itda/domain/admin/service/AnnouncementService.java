package com.project.itda.domain.admin.service;

import com.project.itda.domain.admin.dto.request.AnnouncementCreateRequest;
import com.project.itda.domain.admin.dto.response.AnnouncementResponse;
import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.entity.Announcement;
import com.project.itda.domain.admin.enums.AnnouncementStatus;
import com.project.itda.domain.admin.repository.AdminUserRepository;
import com.project.itda.domain.admin.repository.AnnouncementRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AdminUserRepository adminUserRepository;

    @Transactional
    public AnnouncementResponse createAnnouncement(Long adminId, AnnouncementCreateRequest request) {
        AdminUser author = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));

        Announcement announcement = new Announcement();
        announcement.setAuthor(author);
        announcement.setCategory(request.getCategory());
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setIsPinned(request.getIsPinned());
        announcement.setIsImportant(request.getIsImportant());
        announcement.setStatus(request.getStatus());

        if (request.getStatus() == AnnouncementStatus.PUBLISHED && request.getPublishedAt() == null) {
            announcement.setPublishedAt(LocalDateTime.now());
        } else {
            announcement.setPublishedAt(request.getPublishedAt());
        }

        Announcement saved = announcementRepository.save(announcement);
        return AnnouncementResponse.from(saved);
    }

    @Transactional
    public AnnouncementResponse updateAnnouncement(Long announcementId, AnnouncementCreateRequest request) {
        Announcement announcement = announcementRepository.findByIdWithAuthor(announcementId)
                .orElseThrow(() -> new EntityNotFoundException("공지사항을 찾을 수 없습니다"));

        announcement.setCategory(request.getCategory());
        announcement.setTitle(request.getTitle());
        announcement.setContent(request.getContent());
        announcement.setIsPinned(request.getIsPinned());
        announcement.setIsImportant(request.getIsImportant());
        announcement.setStatus(request.getStatus());

        if (request.getStatus() == AnnouncementStatus.PUBLISHED && announcement.getPublishedAt() == null) {
            announcement.setPublishedAt(LocalDateTime.now());
        }

        return AnnouncementResponse.from(announcement);
    }

    @Transactional
    public void incrementViewCount(Long announcementId) {
        Announcement announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new EntityNotFoundException("공지사항을 찾을 수 없습니다"));
        announcement.setViewCount(announcement.getViewCount() + 1);
    }

    public List<AnnouncementResponse> getAllAnnouncements(AnnouncementStatus status) {
        // N+1 방지: Fetch Join 사용
        return announcementRepository.findAllByStatusWithAuthor(status)
                .stream()
                .map(AnnouncementResponse::from)
                .collect(Collectors.toList());
    }

    public List<AnnouncementResponse> getPinnedAnnouncements() {
        return announcementRepository.findPinnedAnnouncements()
                .stream()
                .map(AnnouncementResponse::from)
                .collect(Collectors.toList());
    }

    public Page<AnnouncementResponse> getAllAnnouncementsPaged(AnnouncementStatus status, Pageable pageable) {
        return announcementRepository.findAllByStatusWithAuthorPaged(status, pageable)
                .map(AnnouncementResponse::from);
    }

    public AnnouncementResponse getAnnouncementById(Long announcementId) {
        Announcement announcement = announcementRepository.findByIdWithAuthor(announcementId)
                .orElseThrow(() -> new EntityNotFoundException("공지사항을 찾을 수 없습니다"));
        return AnnouncementResponse.from(announcement);
    }
}