import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '@/api/client'; // 기존 client.ts 활용

interface ReportDetail {
    reportId: number;
    reportedType: string;
    reason: string;
    description: string;
    status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
    adminNote: string; // 관리자 답변
    createdAt: string;
    resolvedAt: string;
}

const UserReportDetailPage: React.FC = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // 위에서 만든 백엔드 API 호출
                const response = await apiClient.get(`/api/reports/my/${reportId}`);
                setReport(response.data);
            } catch (error) {
                alert("신고 내용을 불러올 수 없습니다.");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [reportId, navigate]);

    if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
    if (!report) return null;

    // 상태에 따른 뱃지 스타일
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'RESOLVED': return { bg: '#d1fae5', text: '#065f46', label: '처리 완료' };
            case 'REJECTED': return { bg: '#fee2e2', text: '#991b1b', label: '반려됨' };
            default: return { bg: '#f3f4f6', text: '#374151', label: '처리 중' };
        }
    };

    const statusStyle = getStatusStyle(report.status);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '10px' }}>
                    ←
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>신고 내역 상세</h2>
            </header>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {/* 1. 처리 결과 섹션 (가장 중요) */}
                <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #eee' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        marginBottom: '12px'
                    }}>
                        {statusStyle.label}
                    </span>

                    {report.resolvedAt && (
                        <div style={{ fontSize: '0.85rem', color: '#888' }}>
                            처리일: {new Date(report.resolvedAt).toLocaleDateString()}
                        </div>
                    )}

                    {/* 관리자 답변 표시 */}
                    {report.adminNote && (
                        <div style={{ marginTop: '16px', backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '12px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4b5563' }}>👮 관리자 답변</div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#1f2937' }}>
                                {report.adminNote}
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. 내가 신고한 내용 */}
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>내 신고 내용</h3>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>신고 사유</div>
                        <div style={{ fontSize: '1rem' }}>{report.reason}</div>
                    </div>

                    {report.description && (
                        <div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>상세 내용</div>
                            <div style={{ fontSize: '0.95rem', color: '#374151', whiteSpace: 'pre-wrap' }}>
                                {report.description}
                            </div>
                        </div>
                    )}

                    <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#9ca3af' }}>
                        접수일: {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserReportDetailPage;