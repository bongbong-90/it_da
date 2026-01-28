import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInquiryById, updateInquiryStatus } from '../../api/admin.api';
import type { InquiryResponse, InquiryStatus, InquiryCategory } from '../../types/admin.types';

const InquiryDetailPage: React.FC = () => {
    const { inquiryId } = useParams<{ inquiryId: string }>();
    const navigate = useNavigate();
    const [inquiry, setInquiry] = useState<InquiryResponse | null>(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (inquiryId) {
            fetchInquiryDetail();
        }
    }, [inquiryId]);

    const fetchInquiryDetail = async () => {
        if (!inquiryId) return;

        try {
            setLoading(true);
            const data = await getInquiryById(Number(inquiryId));
            setInquiry(data);
            setAnswer(data.answer || '');
        } catch (error) {
            console.error('문의 상세 조회 실패:', error);
            alert('문의 정보를 불러오는데 실패했습니다.');
            navigate('/admin/inquiries');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!inquiry || !inquiryId) return;

        if (!answer.trim()) {
            alert('답변 내용을 입력해주세요.');
            return;
        }

        if (!confirm('답변을 등록하시겠습니까?')) {
            return;
        }

        try {
            setProcessing(true);
            await updateInquiryStatus(Number(inquiryId), {
                answer: answer.trim(),
                status: 'ANSWERED'
            });
            alert('답변이 등록되었습니다.');
            fetchInquiryDetail();
        } catch (error) {
            console.error('답변 등록 실패:', error);
            alert('답변 등록에 실패했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    const handleUpdateStatus = async (newStatus: InquiryStatus) => {
        if (!inquiry || !inquiryId) return;

        const statusText = getStatusText(newStatus);
        if (!confirm(`문의를 "${statusText}" 상태로 변경하시겠습니까?`)) {
            return;
        }

        try {
            setProcessing(true);
            await updateInquiryStatus(Number(inquiryId), {
                status: newStatus
            });
            alert('상태가 변경되었습니다.');
            fetchInquiryDetail();
        } catch (error) {
            console.error('상태 변경 실패:', error);
            alert('상태 변경에 실패했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusText = (status: InquiryStatus): string => {
        const statusMap: Record<InquiryStatus, string> = {
            PENDING: '대기',
            ANSWERED: '답변완료',
            CLOSED: '종료'
        };
        return statusMap[status] || status;
    };

    const getStatusBadge = (status: InquiryStatus) => {
        const statusConfig: any = {
            PENDING: { bg: '#fef3c7', color: '#92400e', text: '대기' },
            ANSWERED: { bg: '#d1fae5', color: '#065f46', text: '답변완료' },
            CLOSED: { bg: '#e5e7eb', color: '#374151', text: '종료' },
        };
        const config = statusConfig[status] || statusConfig.PENDING;

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

    const getCategoryText = (category: InquiryCategory): string => {
        const categoryMap: Record<InquiryCategory, string> = {
            ACCOUNT: '계정 문의',
            MEETING: '모임 문의',
            PAYMENT: '결제 문의',
            BUG: '버그 제보',
            SUGGESTION: '기능 제안',
            ETC: '기타 문의'
        };
        return categoryMap[category] || category;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR');
    };

    if (loading || !inquiry) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    const isPending = inquiry.status === 'PENDING';
    const isAnswered = inquiry.status === 'ANSWERED';

    return (
        <div>
            {/* 헤더 */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/admin/inquiries')}
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
                    1:1 문의 상세
                </h2>
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
                        문의 기본 정보
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                문의 번호
                            </label>
                            <div style={{ fontSize: '1rem' }}>#{inquiry.inquiryId}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                카테고리
                            </label>
                            <div style={{ fontSize: '1rem' }}>{getCategoryText(inquiry.category)}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                작성자
                            </label>
                            <div style={{ fontSize: '1rem' }}>
                                {inquiry.username} ({inquiry.email})
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                작성일
                            </label>
                            <div style={{ fontSize: '0.875rem' }}>{formatDate(inquiry.createdAt)}</div>
                        </div>
                    </div>
                </div>

                {/* 문의 내용 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        문의 내용
                    </h3>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            제목
                        </label>
                        <div style={{
                            fontSize: '1rem',
                            padding: '0.75rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            fontWeight: '500'
                        }}>
                            {inquiry.title}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            내용
                        </label>
                        <div style={{
                            fontSize: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            whiteSpace: 'pre-wrap',
                            minHeight: '150px',
                            lineHeight: '1.6'
                        }}>
                            {inquiry.content}
                        </div>
                    </div>
                </div>

                {/* 처리 상태 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        처리 상태
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                현재 상태
                            </label>
                            <div>{getStatusBadge(inquiry.status)}</div>
                        </div>
                        {isAnswered && (
                            <button
                                onClick={() => handleUpdateStatus('CLOSED')}
                                disabled={processing}
                                style={{
                                    marginTop: '1.5rem',
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                종료 처리
                            </button>
                        )}
                    </div>
                </div>

                {/* 답변 (이미 답변한 경우) */}
                {inquiry.answer && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            관리자 답변
                        </h3>
                        <div style={{
                            fontSize: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '0.375rem',
                            borderLeft: '4px solid #3b82f6',
                            whiteSpace: 'pre-wrap',
                            minHeight: '100px',
                            lineHeight: '1.6'
                        }}>
                            {inquiry.answer}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    답변자
                                </label>
                                <div style={{ fontSize: '0.875rem' }}>{inquiry.answeredByName || '-'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    답변일
                                </label>
                                <div style={{ fontSize: '0.875rem' }}>{formatDate(inquiry.answeredAt)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 답변 작성 양식 (대기 상태인 경우) */}
                {isPending && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            답변 작성
                        </h3>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                답변 내용 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                placeholder="문의에 대한 답변을 작성해주세요."
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    resize: 'vertical',
                                    minHeight: '200px',
                                    lineHeight: '1.6'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                onClick={handleSubmitAnswer}
                                disabled={processing || !answer.trim()}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: (processing || !answer.trim()) ? 'not-allowed' : 'pointer',
                                    opacity: (processing || !answer.trim()) ? 0.5 : 1
                                }}
                            >
                                답변 등록
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InquiryDetailPage;