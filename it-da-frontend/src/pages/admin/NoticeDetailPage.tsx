import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNoticeDetail, deleteNotice, toggleNoticePin } from '../../api/admin.api';
import type { NoticeResponse, NoticeStatus, NoticeCategory } from '../../types/admin.types';

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
            const data = await getNoticeDetail(Number(noticeId));
            setNotice(data);
        } catch (error) {
            console.error('공지사항 상세 조회 실패:', error);
            alert('공지사항 정보를 불러오는데 실패했습니다.');
            navigate('/admin/notices');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!notice || !noticeId) return;

        if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
            return;
        }

        try {
            await deleteNotice(Number(noticeId));
            alert('공지사항이 삭제되었습니다.');
            navigate('/admin/notices');
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('공지사항 삭제에 실패했습니다.');
        }
    };

    const handleTogglePin = async () => {
        if (!notice || !noticeId) return;

        try {
            await toggleNoticePin(Number(noticeId));
            alert('고정 상태가 변경되었습니다.');
            fetchNoticeDetail();
        } catch (error) {
            console.error('고정 토글 실패:', error);
            alert('고정 상태 변경에 실패했습니다.');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR');
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
                padding: '0.5rem 1rem',
                backgroundColor: config.bg,
                color: config.color,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: '600'
            }}>
                {config.text}
            </span>
        );
    };

    const getCategoryText = (category: NoticeCategory): string => {
        const categoryMap: Record<NoticeCategory, string> = {
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    return (
        <div>
            {/* 헤더 */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => navigate('/admin/notices')}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        ← 목록으로
                    </button>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        공지사항 상세
                    </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleTogglePin}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: notice.isPinned ? '#fef3c7' : '#f3f4f6',
                            color: notice.isPinned ? '#92400e' : '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        {notice.isPinned ? '📌 고정 해제' : '📌 상단 고정'}
                    </button>
                    <button
                        onClick={() => navigate(`/admin/notices/${noticeId}/edit`)}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        수정
                    </button>
                    <button
                        onClick={handleDelete}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                        }}
                    >
                        삭제
                    </button>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '2rem'
            }}>
                {/* 기본 정보 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        기본 정보
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                공지사항 번호
                            </label>
                            <div style={{ fontSize: '1rem' }}>#{notice.announcementId}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                카테고리
                            </label>
                            <div style={{ fontSize: '1rem' }}>{getCategoryText(notice.category)}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                작성자
                            </label>
                            <div style={{ fontSize: '1rem' }}>{notice.authorName}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                상태
                            </label>
                            <div>{getStatusBadge(notice.status)}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                조회수
                            </label>
                            <div style={{ fontSize: '1rem' }}>{notice.viewCount}회</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                게시일
                            </label>
                            <div style={{ fontSize: '0.875rem' }}>{formatDate(notice.publishedAt)}</div>
                        </div>
                    </div>

                    {/* 고정/중요 표시 */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        {notice.isPinned && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                📌 상단 고정
                            </span>
                        )}
                        {notice.isImportant && (
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                            }}>
                                🔴 중요
                            </span>
                        )}
                    </div>
                </div>

                {/* 공지사항 내용 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        공지사항 내용
                    </h3>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            제목
                        </label>
                        <div style={{
                            fontSize: '1.125rem',
                            padding: '0.75rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            fontWeight: '600'
                        }}>
                            {notice.title}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            내용
                        </label>
                        <div style={{
                            fontSize: '0.875rem',
                            padding: '1.5rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            whiteSpace: 'pre-wrap',
                            minHeight: '200px',
                            lineHeight: '1.8'
                        }}>
                            {notice.content}
                        </div>
                    </div>
                </div>

                {/* 메타 정보 */}
                <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    color: '#6b7280'
                }}>
                    <div>작성일: {formatDate(notice.createdAt)}</div>
                    <div>수정일: {formatDate(notice.updatedAt)}</div>
                </div>
            </div>
        </div>
    );
};

export default NoticeDetailPage;