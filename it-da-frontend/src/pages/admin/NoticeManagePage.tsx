import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNoticeList, deleteNotice, toggleNoticePin } from '../../api/admin.api';
import type { NoticeResponse, NoticeStatus, NoticeCategory } from '../../types/admin.types';

const NoticeManagePage: React.FC = () => {
    const navigate = useNavigate();
    const [notices, setNotices] = useState<NoticeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('PUBLISHED');

    useEffect(() => {
        fetchNotices();
    }, [page, statusFilter]);


    const sortNotices = (noticeList: NoticeResponse[]) => {
        return [...noticeList].sort((a, b) => {
            // 1순위: 고정 여부 (고정된 것이 위로)
            if (a.isPinned !== b.isPinned) {
                return a.isPinned ? -1 : 1;
            }

            // 2순위: 게시일 (최신순)
            const dateA = new Date(a.publishedAt || a.createdAt).getTime();
            const dateB = new Date(b.publishedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    };

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const data = await getNoticeList(page, 10, statusFilter);
            const sortedNotices = sortNotices(data.content);
            setNotices(sortedNotices);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('공지사항 목록 조회 실패:', error);
            alert('공지사항 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (noticeId: number) => {
        if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            return;
        }

        try {
            await deleteNotice(noticeId);
            alert('공지사항이 삭제되었습니다.');
            fetchNotices();
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('공지사항 삭제에 실패했습니다.');
        }
    };

    const handleTogglePin = async (noticeId: number) => {
        try {
            await toggleNoticePin(noticeId);
            await fetchNotices();
        } catch (error) {
            console.error('고정 토글 실패:', error);
            alert('고정 상태 변경에 실패했습니다.');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getStatusText = (status: NoticeStatus): string => {
        const statusMap: Record<NoticeStatus, string> = {
            DRAFT: '임시저장',
            PUBLISHED: '게시',
            HIDDEN: '숨김'
        };
        return statusMap[status] || status;
    };

    const getStatusBadge = (status: NoticeStatus) => {
        const statusConfig: any = {
            DRAFT: { bg: '#e5e7eb', color: '#374151', text: '임시저장' },
            PUBLISHED: { bg: '#d1fae5', color: '#065f46', text: '게시' },
            HIDDEN: { bg: '#fee2e2', color: '#991b1b', text: '숨김' },
        };
        const config = statusConfig[status] || statusConfig.DRAFT;

        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: config.bg,
                color: config.color,
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500'
            }}>
                {config.text}
            </span>
        );
    };

    const getCategoryText = (category: NoticeCategory): string => {
        const categoryMap: Record<NoticeCategory, string> = {
            NOTICE: '공지',
            EVENT: '이벤트',
            UPDATE: '업데이트',
            MAINTENANCE: '점검',
            GUIDE: '가이드'
        };
        return categoryMap[category] || category;
    };

    if (loading && notices.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    공지사항 관리
                </h2>
                <button
                    onClick={() => navigate('/admin/notices/create')}
                    style={{
                        padding: '0.5rem 1.5rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    + 새 공지사항 작성
                </button>
            </div>

            {/* 필터 */}
            <div style={{
                backgroundColor: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>상태:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="PUBLISHED">게시</option>
                        <option value="DRAFT">임시저장</option>
                        <option value="HIDDEN">숨김</option>
                    </select>
                </div>
            </div>

            {/* 공지사항 목록 */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                        전체 공지사항 ({totalElements}건)
                    </h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                            <th style={{ padding: '1rem', width: '80px' }}>고정</th>
                            <th style={{ padding: '1rem', width: '100px' }}>카테고리</th>
                            <th style={{ padding: '1rem' }}>제목</th>
                            <th style={{ padding: '1rem', width: '120px' }}>작성자</th>
                            <th style={{ padding: '1rem', width: '100px' }}>조회수</th>
                            <th style={{ padding: '1rem', width: '120px' }}>게시일</th>
                            <th style={{ padding: '1rem', width: '100px' }}>상태</th>
                            <th style={{ padding: '1rem', width: '200px' }}>관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {notices.map((notice) => (
                            <tr key={notice.announcementId}
                                style={{
                                    borderTop: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                onClick={() => navigate(`/admin/notices/${notice.announcementId}`)}
                            >
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTogglePin(notice.announcementId);
                                        }}
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: notice.isPinned ? '#fef3c7' : 'transparent',
                                            color: notice.isPinned ? '#92400e' : '#9ca3af',
                                            border: '1px solid',
                                            borderColor: notice.isPinned ? '#fbbf24' : '#d1d5db',
                                            borderRadius: '0.25rem',
                                            fontSize: '1.25rem',  // 이모지 크기
                                            cursor: 'pointer',
                                            lineHeight: '1',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '36px',
                                            height: '36px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!notice.isPinned) {
                                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                e.currentTarget.style.borderColor = '#9ca3af';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!notice.isPinned) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                            }
                                        }}
                                        title={notice.isPinned ? '고정 해제' : '상단 고정'}  // 툴팁으로 설명 제공
                                    >
                                        {notice.isPinned ? '📌' : '📍'}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {getCategoryText(notice.category)}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {notice.isImportant && (
                                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🔴</span>
                                        )}
                                        <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {notice.title}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {notice.authorName}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {notice.viewCount}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    {formatDate(notice.publishedAt)}
                                </td>
                                <td style={{ padding: '1rem' }}>{getStatusBadge(notice.status)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/admin/notices/${notice.announcementId}/edit`);
                                            }}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notice.announcementId);
                                            }}
                                            style={{
                                                padding: '0.25rem 0.75rem',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.25rem',
                                                fontSize: '0.875rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {notices.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                    }}>
                        공지사항이 없습니다.
                    </div>
                )}

                {/* 페이지네이션 */}
                <div style={{
                    padding: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}>
                    <button
                        onClick={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            backgroundColor: page === 0 ? '#f3f4f6' : 'white',
                            cursor: page === 0 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        이전
                    </button>
                    <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                        {page + 1} / {totalPages || 1}
                    </span>
                    <button
                        onClick={() => setPage(Math.min((totalPages || 1) - 1, page + 1))}
                        disabled={page >= (totalPages || 1) - 1}
                        style={{
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            backgroundColor: page >= (totalPages || 1) - 1 ? '#f3f4f6' : 'white',
                            cursor: page >= (totalPages || 1) - 1 ? 'not-allowed' : 'pointer'
                        }}
                    >
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticeManagePage;