import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportById, updateReportStatus } from '../../api/admin.api';
import type { ReportResponse, ReportStatus } from '../../types/admin.types';

const ReportDetailPage: React.FC = () => {
    const { reportId } = useParams<{ reportId: string }>();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportResponse | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (reportId) {
            fetchReportDetail();
        }
    }, [reportId]);

    const fetchReportDetail = async () => {
        if (!reportId) return;

        try {
            setLoading(true);
            const data = await getReportById(Number(reportId));
            setReport(data);
            setAdminNote(data.adminNote || '');
        } catch (error) {
            console.error('신고 상세 조회 실패:', error);
            alert('신고 정보를 불러오는데 실패했습니다.');
            navigate('/admin/reports');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: ReportStatus) => {
        if (!report || !reportId) return;

        if (!adminNote.trim()) {
            alert('처리 의견을 입력해주세요.');
            return;
        }

        const statusText = getStatusText(newStatus);
        if (!confirm(`신고를 "${statusText}" 상태로 변경하시겠습니까?`)) {
            return;
        }

        try {
            setProcessing(true);
            await updateReportStatus(Number(reportId), {
                status: newStatus,
                adminNote: adminNote.trim(),
            });
            alert('신고가 처리되었습니다.');
            fetchReportDetail(); // 새로고침
        } catch (error) {
            console.error('신고 처리 실패:', error);
            alert('신고 처리에 실패했습니다.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusText = (status: ReportStatus): string => {
        const statusMap: Record<ReportStatus, string> = {
            PENDING: '대기',
            REVIEWING: '검토중',
            RESOLVED: '처리완료',
            REJECTED: '반려'
        };
        return statusMap[status] || status;
    };

    const getStatusBadge = (status: ReportStatus) => {
        const statusConfig: any = {
            PENDING: { bg: '#fef3c7', color: '#92400e', text: '대기' },
            REVIEWING: { bg: '#dbeafe', color: '#1e40af', text: '검토중' },
            RESOLVED: { bg: '#d1fae5', color: '#065f46', text: '처리완료' },
            REJECTED: { bg: '#fee2e2', color: '#991b1b', text: '반려' },
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

    const getTypeText = (type: 'USER' | 'MEETING'): string => {
        return type === 'USER' ? '유저 신고' : '모임 신고';
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('ko-KR');
    };

    if (loading || !report) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    const isPending = report.status === 'PENDING' || report.status === 'REVIEWING';

    return (
        <div>
            {/* 헤더 */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/admin/reports')}
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
                    신고 상세
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
                        신고 기본 정보
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                신고 번호
                            </label>
                            <div style={{ fontSize: '1rem' }}>#{report.reportId}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                신고 유형
                            </label>
                            <div style={{ fontSize: '1rem' }}>{getTypeText(report.reportedType)}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                신고자 ID
                            </label>
                            <div style={{ fontSize: '1rem' }}>{report.reporterId}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                신고 대상 ID
                            </label>
                            <div style={{ fontSize: '1rem' }}>
                                {report.reportedType} #{report.reportedId}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 신고 내용 */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        paddingBottom: '0.5rem',
                        borderBottom: '2px solid #e5e7eb'
                    }}>
                        신고 내용
                    </h3>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            신고 사유
                        </label>
                        <div style={{ fontSize: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                            {report.reason}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                            상세 설명
                        </label>
                        <div style={{
                            fontSize: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            whiteSpace: 'pre-wrap',
                            minHeight: '100px'
                        }}>
                            {report.description || '(상세 설명 없음)'}
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                현재 상태
                            </label>
                            <div>{getStatusBadge(report.status)}</div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                신고일
                            </label>
                            <div style={{ fontSize: '0.875rem' }}>{formatDate(report.createdAt)}</div>
                        </div>
                    </div>
                </div>

                {/* 처리 정보 (처리된 경우) */}
                {!isPending && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            관리자 처리 의견
                        </h3>
                        <div style={{
                            fontSize: '0.875rem',
                            padding: '1rem',
                            backgroundColor: '#f0f9ff',
                            borderRadius: '0.375rem',
                            borderLeft: '4px solid #3b82f6',
                            whiteSpace: 'pre-wrap',
                            minHeight: '80px'
                        }}>
                            {report.adminNote || '(처리 의견 없음)'}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    처리자
                                </label>
                                <div style={{ fontSize: '0.875rem' }}>{report.resolvedByName || '-'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                    처리일
                                </label>
                                <div style={{ fontSize: '0.875rem' }}>{formatDate(report.resolvedAt)}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 처리 양식 (대기/검토중인 경우) */}
                {isPending && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #e5e7eb'
                        }}>
                            신고 처리
                        </h3>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
                                관리자 처리 의견 <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                                value={adminNote}
                                onChange={(e) => setAdminNote(e.target.value)}
                                placeholder="처리 의견을 입력하세요 (필수)"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    resize: 'vertical',
                                    minHeight: '120px'
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                onClick={() => handleUpdateStatus('REVIEWING')}
                                disabled={processing}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                검토중으로 변경
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('REJECTED')}
                                disabled={processing}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                반려
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('RESOLVED')}
                                disabled={processing}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.5rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: processing ? 'not-allowed' : 'pointer',
                                    opacity: processing ? 0.5 : 1
                                }}
                            >
                                처리완료
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportDetailPage;