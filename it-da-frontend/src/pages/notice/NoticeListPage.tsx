import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicNoticeList } from '@/api/public.api';
import type { NoticeResponse } from '@/types/admin.types';
import Header from '@/components/layout/Header';

const NoticeListPage: React.FC = () => {
    const navigate = useNavigate();
    const [notices, setNotices] = useState<NoticeResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchNotices();
    }, [page]);

    const fetchNotices = async () => {
        try {
            setLoading(true);
            const data = await getPublicNoticeList(page, 10); // 게시된 공지사항만

            // 고정된 공지사항을 먼저, 그 다음 최신순
            const sortedNotices = [...data.content].sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                    return a.isPinned ? -1 : 1;
                }
                const dateA = new Date(a.publishedAt || a.createdAt).getTime();
                const dateB = new Date(b.publishedAt || b.createdAt).getTime();
                return dateB - dateA;
            });

            setNotices(sortedNotices);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('공지사항 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR');
    };

    const getCategoryText = (category: string): string => {
        const categoryMap: any = {
            NOTICE: '공지',
            EVENT: '이벤트',
            UPDATE: '업데이트',
            MAINTENANCE: '점검',
            GUIDE: '가이드'
        };
        return categoryMap[category] || category;
    };

    if (loading) {
        return (
            <>
                <Header />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                    <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />  {/* ✅ 추가 */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

            {/* 공지사항 목록 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                {notices.length > 0 ? (
                    <div>
                        {notices.map((notice) => (
                            <div
                                key={notice.announcementId}
                                onClick={() => navigate(`/notices/${notice.announcementId}`)}
                                style={{
                                    padding: '1.5rem',
                                    borderBottom: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    backgroundColor: notice.isPinned ? '#fffbeb' : 'white'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notice.isPinned ? '#fef3c7' : '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notice.isPinned ? '#fffbeb' : 'white'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    {/* 고정 아이콘 */}
                                    {notice.isPinned && (
                                        <span style={{ fontSize: '1.25rem' }}>📌</span>
                                    )}

                                    {/* 중요 표시 */}
                                    {notice.isImportant && (
                                        <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.25rem' }}>🔴</span>
                                    )}

                                    {/* 카테고리 */}
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        backgroundColor: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '500'
                                    }}>
                                        {getCategoryText(notice.category)}
                                    </span>

                                    {/* 제목 */}
                                    <h3 style={{
                                        fontSize: '1.125rem',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        flex: 1
                                    }}>
                                        {notice.title}
                                    </h3>

                                    {/* 조회수 */}
                                    <span style={{
                                        fontSize: '0.875rem',
                                        color: '#6b7280'
                                    }}>
                                        👁️ {notice.viewCount}
                                    </span>
                                </div>

                                {/* 날짜 */}
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    marginLeft: notice.isPinned || notice.isImportant ? '2rem' : '0'
                                }}>
                                    {formatDate(notice.publishedAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem',
                        color: '#6b7280'
                    }}>
                        등록된 공지사항이 없습니다.
                    </div>
                )}

                {/* 페이지네이션 */}
                {notices.length > 0 && (
                    <div style={{
                        padding: '1.5rem',
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
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            style={{
                                padding: '0.5rem 1rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                backgroundColor: page >= totalPages - 1 ? '#f3f4f6' : 'white',
                                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            다음
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default NoticeListPage;