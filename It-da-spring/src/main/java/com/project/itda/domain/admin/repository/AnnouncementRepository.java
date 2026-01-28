package com.project.itda.domain.admin.repository;

import com.project.itda.domain.admin.entity.Announcement;
import com.project.itda.domain.admin.enums.AnnouncementCategory;
import com.project.itda.domain.admin.enums.AnnouncementStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    // N+1 방지: author를 Fetch Join으로 조회
    @Query("SELECT a FROM Announcement a JOIN FETCH a.author WHERE a.status = :status ORDER BY a.isPinned DESC, a.publishedAt DESC")
    List<Announcement> findAllByStatusWithAuthor(@Param("status") AnnouncementStatus status);

    @Query("SELECT a FROM Announcement a JOIN FETCH a.author WHERE a.announcementId = :id")
    Optional<Announcement> findByIdWithAuthor(@Param("id") Long id);

    // 카테고리별 조회 (N+1 방지)
    @Query("SELECT a FROM Announcement a JOIN FETCH a.author WHERE a.category = :category AND a.status = :status ORDER BY a.isPinned DESC, a.publishedAt DESC")
    List<Announcement> findByCategoryAndStatusWithAuthor(
            @Param("category") AnnouncementCategory category,
            @Param("status") AnnouncementStatus status
    );

    // 페이징 + Fetch Join + (고정 우선, 최신순 정렬)
    @Query(value = "SELECT a FROM Announcement a JOIN FETCH a.author " +
            "WHERE a.status = :status " +
            "ORDER BY a.isPinned DESC, a.publishedAt DESC, a.createdAt DESC",
            countQuery = "SELECT COUNT(a) FROM Announcement a WHERE a.status = :status")
    Page<Announcement> findAllByStatusWithAuthorPaged(@Param("status") AnnouncementStatus status, Pageable pageable);

    // 고정 공지 조회
    @Query("SELECT a FROM Announcement a JOIN FETCH a.author WHERE a.isPinned = true AND a.status = 'PUBLISHED' ORDER BY a.publishedAt DESC")
    List<Announcement> findPinnedAnnouncements();
}