import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPublicNoticeDetail } from '@/api/public.api';
import type { NoticeResponse } from '@/types/admin.types';
import Header from '@/components/layout/Header';

const NoticeDetailPage: React.FC = () => {
    const { noticeId } = useParams<{ noticeId: string }>();
    const navigate = useNavigate();
    const [notice, setNotice] = useState<NoticeResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (noticeId) {
            fetchNoticeDetail();
        }
    }, [noticeId]);

    const fetchNoticeDetail = async () => {
        if (!noticeId) return;

        try {
            setLoading(true);
            const data = await getPublicNoticeDetail(Number(noticeId));
            setNotice(data);
        } catch (error) {
            console.error('공지사항 상세 조회 실패:', error);
            alert('공지사항을 불러오는데 실패했습니다.');
            navigate('/notices');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR');
    };

    const getCategoryText = (category: string): string => {
        const categoryMap: any = {
            NOTICE: '공지사항',
            EVENT: '이벤트',
            UPDATE: '업데이트',
            MAINTENANCE: '점검',
            GUIDE: '가이드'
        };
        return categoryMap[category] || category;
    };

    if (loading || !notice) {
        return (
            <>
                <header />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
            </>
        );
    }

    return (
        <>
            <Header/>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            {/* 뒤로 가기 버튼 */}
            <button
                onClick={() => navigate('/notices')}
                style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem'
                }}
            >
                ← 목록으로
            </button>

            {/* 공지사항 상세 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '2rem'
            }}>
                {/* 헤더 */}
                <div style={{
                    paddingBottom: '1.5rem',
                    borderBottom: '2px solid #e5e7eb',
                    marginBottom: '2rem'
                }}>
                    {/* 카테고리 & 뱃지 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            borderRadius: '0.25rem',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}>
                            {getCategoryText(notice.category)}
                        </span>

                        {notice.isPinned && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}>
                                📌 고정
                            </span>
                        )}

                        {notice.isImportant && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                            }}>
                                🔴 중요
                            </span>
                        )}
                    </div>

                    {/* 제목 */}
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        marginBottom: '1rem'
                    }}>
                        {notice.title}
                    </h1>

                    {/* 메타 정보 */}
                    <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                    }}>
                        <span>작성자: {notice.authorName}</span>
                        <span>작성일: {formatDate(notice.publishedAt)}</span>
                        <span>조회수: {notice.viewCount}</span>
                    </div>
                </div>

                {/* 내용 */}
                <div style={{
                    fontSize: '1rem',
                    lineHeight: '1.8',
                    color: '#374151',
                    whiteSpace: 'pre-wrap',
                    minHeight: '300px'
                }}>
                    {notice.content}
                </div>
            </div>
        </div>
        </>
    );
};

export default NoticeDetailPage;