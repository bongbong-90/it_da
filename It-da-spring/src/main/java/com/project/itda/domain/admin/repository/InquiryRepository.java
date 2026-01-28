package com.project.itda.domain.admin.repository;

import com.project.itda.domain.admin.entity.Inquiry;
import com.project.itda.domain.admin.enums.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Long countByStatus(InquiryStatus status);

    /**
     * 제목, 이메일, 내용으로 검색 + 페이징
     */
    @Query("SELECT i FROM Inquiry i WHERE " +
            "(:search IS NULL OR " +
            "i.title LIKE %:search% OR " +
            "i.email LIKE %:search% OR " +
            "i.content LIKE %:search%) " +
            "ORDER BY i.createdAt DESC")
    Page<Inquiry> findAllWithSearch(@Param("search") String search, Pageable pageable);

    /**
     * 전체 조회 (최신순 정렬)
     */
    Page<Inquiry> findAllByOrderByCreatedAtDesc(Pageable pageable);
}