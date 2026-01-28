package com.project.itda.domain.admin.repository;

import com.project.itda.domain.admin.entity.Report;
import com.project.itda.domain.admin.enums.ReportStatus;
import com.project.itda.domain.admin.enums.ReportedType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {

    // ✅ 상태별 페이징 조회 (Service에서 사용)
    Page<Report> findAllByStatus(ReportStatus status, Pageable pageable);

    // 대시보드용 (PENDING 카운트)
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.status = :status")
    List<Report> findAllByStatusWithResolver(@Param("status") ReportStatus status);

    // 신고 상세 조회 (N+1 방지)
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.reportId = :id")
    Optional<Report> findByIdWithResolver(@Param("id") Long id);

    // 신고 대상별 조회
    @Query("""
        SELECT r FROM Report r
        LEFT JOIN FETCH r.resolvedBy
        WHERE r.reportedType = :type
          AND r.reportedId = :id
        ORDER BY r.createdAt DESC
    """)
    List<Report> findByReportedTargetWithResolver(
            @Param("type") ReportedType type,
            @Param("id") Long id
    );

    // 전체 페이징 (status 없음)
    @Query(
            value = "SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy",
            countQuery = "SELECT COUNT(r) FROM Report r"
    )
    Page<Report> findAllWithResolverPaged(Pageable pageable);

    // 특정 신고자 기준
    @Query("""
        SELECT r FROM Report r
        LEFT JOIN FETCH r.resolvedBy
        WHERE r.reporterId = :reporterId
        ORDER BY r.createdAt DESC
    """)
    List<Report> findByReporterIdWithResolver(@Param("reporterId") Long reporterId);
}
