import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getNoticeDetail,
    createNotice,
    updateNotice
} from '../../api/admin.api';
import type {
    NoticeCategory,
    NoticeStatus,
    NoticeCreateRequest,
    NoticeUpdateRequest
} from '../../types/admin.types';

const NoticeFormPage: React.FC = () => {
    const { noticeId } = useParams<{ noticeId: string }>();
    const navigate = useNavigate();
    const isEditMode = !!noticeId;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // 폼 데이터
    const [category, setCategory] = useState<NoticeCategory>('NOTICE');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPinned, setIsPinned] = useState(false);
    const [isImportant, setIsImportant] = useState(false);
    const [status, setStatus] = useState<NoticeStatus>('PUBLISHED');

    useEffect(() => {
        if (isEditMode && noticeId) {
            fetchNoticeDetail();
        }
    }, [noticeId]);

    const fetchNoticeDetail = async () => {
        if (!noticeId) return;

        try {
            setLoading(true);
            const data = await getNoticeDetail(Number(noticeId));
            setCategory(data.category);
            setTitle(data.title);
            setContent(data.content);
            setIsPinned(data.isPinned);
            setIsImportant(data.isImportant);
            setStatus(data.status);
        } catch (error) {
            console.error('공지사항 조회 실패:', error);
            alert('공지사항 정보를 불러오는데 실패했습니다.');
            navigate('/admin/notices');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return false;
        }
        if (title.length > 200) {
            alert('제목은 200자를 초과할 수 없습니다.');
            return false;
        }
        if (!content.trim()) {
            alert('내용을 입력해주세요.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const confirmMessage = isEditMode
            ? '공지사항을 수정하시겠습니까?'
            : '공지사항을 등록하시겠습니까?';

        if (!confirm(confirmMessage)) return;

        try {
            setSubmitting(true);

            const requestData = {
                category,
                title: title.trim(),
                content: content.trim(),
                isPinned,
                isImportant,
                status,
                publishedAt: status === 'PUBLISHED' ? new Date().toISOString() : undefined
            };

            if (isEditMode && noticeId) {
                await updateNotice(Number(noticeId), requestData as NoticeUpdateRequest);
                alert('공지사항이 수정되었습니다.');
            } else {
                await createNotice(requestData as NoticeCreateRequest);
                alert('공지사항이 등록되었습니다.');
            }

            navigate('/admin/notices');
        } catch (error) {
            console.error('저장 실패:', error);
            alert('공지사항 저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveDraft = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        try {
            setSubmitting(true);

            const requestData = {
                category,
                title: title.trim(),
                content: content.trim(),
                isPinned,
                isImportant,
                status: 'DRAFT' as NoticeStatus
            };

            if (isEditMode && noticeId) {
                await updateNotice(Number(noticeId), requestData as NoticeUpdateRequest);
            } else {
                await createNotice(requestData as NoticeCreateRequest);
            }

            alert('임시저장되었습니다.');
            navigate('/admin/notices');
        } catch (error) {
            console.error('임시저장 실패:', error);
            alert('임시저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    return (
        <div>
            {/* 헤더 */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                    {isEditMode ? '공지사항 수정' : '새 공지사항 작성'}
                </h2>
            </div>

            {/* 폼 */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '2rem'
            }}>
                {/* 카테고리 & 상태 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                        }}>
                            카테고리 <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as NoticeCategory)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="NOTICE">공지사항</option>
                            <option value="EVENT">이벤트</option>
                            <option value="UPDATE">업데이트</option>
                            <option value="MAINTENANCE">점검</option>
                            <option value="GUIDE">가이드</option>
                        </select>
                    </div>
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                        }}>
                            상태 <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as NoticeStatus)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.375rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="PUBLISHED">게시</option>
                            <option value="DRAFT">임시저장</option>
                            <option value="HIDDEN">숨김</option>
                        </select>
                    </div>
                </div>

                {/* 제목 */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                    }}>
                        제목 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="공지사항 제목을 입력하세요 (최대 200자)"
                        maxLength={200}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                        }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {title.length} / 200자
                    </div>
                </div>

                {/* 내용 */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                    }}>
                        내용 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="공지사항 내용을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                            minHeight: '300px',
                            lineHeight: '1.6'
                        }}
                    />
                </div>

                {/* 옵션 */}
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.75rem'
                    }}>
                        옵션
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>📌 상단 고정</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isImportant}
                                onChange={(e) => setIsImportant(e.target.checked)}
                                style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem' }}>🔴 중요 표시</span>
                        </label>
                    </div>
                </div>

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSaveDraft}
                        disabled={submitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.5 : 1
                        }}
                    >
                        임시저장
                    </button>
                    <button
                        onClick={() => navigate('/admin/notices')}
                        disabled={submitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'white',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            opacity: submitting ? 0.5 : 1
                        }}
                    >
                        {isEditMode ? '수정 완료' : '등록'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NoticeFormPage;