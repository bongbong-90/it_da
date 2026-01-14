package com.project.itda.domain.meeting.repository;

import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.enums.MeetingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 모임 레포지토리
 */
@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    /**
     * ID로 모임 조회 (삭제되지 않은 것만)
     * - 기본 JpaRepository의 findById와 이름이 같으면 혼동이 생길 수 있어 method명을 명확히 분리
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.meetingId = :meetingId
              AND m.deletedAt IS NULL
           """)
    Optional<Meeting> findActiveById(@Param("meetingId") Long meetingId);

    /**
     * ID 리스트로 모임 조회 (삭제되지 않은 것만)
     * - 추천 로직에서 organizer 정보도 바로 쓰면 N+1 / Lazy 이슈가 날 수 있어서 fetch join 포함
     */
    @Query("""
            SELECT DISTINCT m
            FROM Meeting m
            JOIN FETCH m.organizer o
            WHERE m.meetingId IN :ids
              AND m.deletedAt IS NULL
           """)
    List<Meeting> findAllActiveByIdInFetchOrganizer(@Param("ids") List<Long> ids);

    /**
     * (옵션) ID 리스트로 모임 조회 (삭제되지 않은 것만) - organizer fetch 없이
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.meetingId IN :ids
              AND m.deletedAt IS NULL
           """)
    List<Meeting> findAllActiveByIdIn(@Param("ids") List<Long> ids);

    /**
     * 모임 평균 평점 업데이트
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Meeting m
               SET m.avgRating = :avgRating
             WHERE m.meetingId = :meetingId
           """)
    void updateAvgRating(
            @Param("meetingId") Long meetingId,
            @Param("avgRating") Double avgRating
    );

    /**
     * 상태별 모임 조회 (페이징)
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.status = :status
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
           """)
    Page<Meeting> findByStatus(
            @Param("status") MeetingStatus status,
            Pageable pageable
    );

    /**
     * 카테고리별 모임 조회 (모집 중)
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.category = :category
              AND m.status = 'RECRUITING'
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
           """)
    List<Meeting> findByCategoryAndStatusRecruiting(@Param("category") String category);

    /**
     * 주최자별 모임 조회
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.organizer.userId = :organizerId
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
           """)
    List<Meeting> findByOrganizerId(@Param("organizerId") Long organizerId);

    /**
     * 키워드 검색 (제목 + 설명)
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE (m.title LIKE %:keyword% OR m.description LIKE %:keyword%)
              AND m.status = 'RECRUITING'
              AND m.deletedAt IS NULL
            ORDER BY m.createdAt DESC
           """)
    Page<Meeting> searchByKeyword(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * 날짜 범위로 모임 조회
     */
    @Query("""
            SELECT m
            FROM Meeting m
            WHERE m.meetingTime BETWEEN :startDate AND :endDate
              AND m.status = 'RECRUITING'
              AND m.deletedAt IS NULL
            ORDER BY m.meetingTime ASC
           """)
    List<Meeting> findByMeetingTimeBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 위치 기반 모임 조회 (Haversine 공식)
     * Native Query 사용
     *
     * 주의:
     * - SELECT * 과 distance alias 컬럼을 같이 가져오면 JPA가 엔티티 매핑할 때 컬럼 충돌/매핑 이슈가 날 수 있음
     * - 실무에선 projection(DTO) 또는 (id만 조회 후 다시 fetch) 패턴을 추천
     */
    @Query(value =
            "SELECT m.*, " +
                    "(6371 * acos(cos(radians(:latitude)) * cos(radians(m.latitude)) * " +
                    "cos(radians(m.longitude) - radians(:longitude)) + sin(radians(:latitude)) * " +
                    "sin(radians(m.latitude)))) AS distance " +
                    "FROM meetings m " +
                    "WHERE m.status = 'RECRUITING' " +
                    "AND m.deleted_at IS NULL " +
                    "HAVING distance < :radius " +
                    "ORDER BY distance",
            nativeQuery = true)
    List<Meeting> findNearbyMeetings(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radius") Double radius
    );
}
