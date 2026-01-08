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

    // N+1 방지: resolvedBy를 LEFT JOIN FETCH로 조회 (null일 수 있음)
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.status = :status ORDER BY r.createdAt DESC")
    List<Report> findAllByStatusWithResolver(@Param("status") ReportStatus status);

    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.reportId = :id")
    Optional<Report> findByIdWithResolver(@Param("id") Long id);

    // 신고 대상별 조회 (N+1 방지)
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.reportedType = :type AND r.reportedId = :id ORDER BY r.createdAt DESC")
    List<Report> findByReportedTargetWithResolver(
            @Param("type") ReportedType type,
            @Param("id") Long id
    );

    // 페이징 + Fetch Join
    @Query(value = "SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy",
            countQuery = "SELECT COUNT(r) FROM Report r")
    Page<Report> findAllWithResolverPaged(Pageable pageable);

    // 특정 신고자의 신고 목록
    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.resolvedBy WHERE r.reporterId = :reporterId ORDER BY r.createdAt DESC")
    List<Report> findByReporterIdWithResolver(@Param("reporterId") Long reporterId);
}