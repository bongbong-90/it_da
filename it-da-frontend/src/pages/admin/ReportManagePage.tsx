import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReportsPaged } from '../../api/admin.api';
import type { ReportResponse, ReportStatus } from '../../types/admin.types';

const ReportManagePage: React.FC = () => {
    const navigate = useNavigate();
    const [allReports, setAllReports] = useState<ReportResponse[]>([]);
    const [filteredReports, setFilteredReports] = useState<ReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchReports();
    }, [page]);

    // ✅ 검색 & 필터링 로직
    useEffect(() => {
        applyFilters();
    }, [search, statusFilter, allReports]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: page,
                size: 10,
            };

            const data = await getReportsPaged(params);
            setAllReports(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('신고 목록 조회 실패:', error);
            alert('신고 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ 필터링 적용 함수
    const applyFilters = () => {
        let filtered = [...allReports];

        // 상태 필터
        if (statusFilter) {
            filtered = filtered.filter(report => report.status === statusFilter);
        }

        // 검색 필터 (ID, 사유, 대상 ID로 검색)
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(report =>
                report.reportId.toString().includes(searchLower) ||
                report.reason.toLowerCase().includes(searchLower) ||
                report.reportedId.toString().includes(searchLower) ||
                report.reporterId.toString().includes(searchLower)
            );
        }

        setFilteredReports(filtered);
    };

    const handleSearch = () => {
        applyFilters(); // 이미 useEffect에서 처리하지만, 명시적으로 호출
    };

    const handleReportClick = (reportId: number) => {
        navigate(`/admin/reports/${reportId}`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR');
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

    const getTypeText = (type: 'USER' | 'MEETING'): string => {
        return type === 'USER' ? '유저' : '모임';
    };

    if (loading && allReports.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    // ✅ 표시할 데이터 결정
    const displayReports = filteredReports;
    const displayTotal = filteredReports.length;

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                신고 관리
            </h2>

            {/* 검색 영역 */}
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="신고 번호, 사유, 신고자/대상 ID 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        style={{
                            flex: 1,
                            padding: '0.5rem 1rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem'
                        }}
                    />
                    <button
                        onClick={handleSearch}
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
                        검색
                    </button>
                    {(search || statusFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                            }}
                        >
                            초기화
                        </button>
                    )}
                </div>
            </div>

            {/* 신고 목록 */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                            {statusFilter ? `${getStatusText(statusFilter as ReportStatus)} 신고` : '전체 신고'} ({displayTotal}건)
                            {search && <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                검색: "{search}"
                            </span>}
                        </h3>
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
                            <option value="">전체</option>
                            <option value="PENDING">대기</option>
                            <option value="REVIEWING">검토중</option>
                            <option value="RESOLVED">처리완료</option>
                            <option value="REJECTED">반려</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>유형</th>
                            <th style={{ padding: '1rem' }}>대상 ID</th>
                            <th style={{ padding: '1rem' }}>사유</th>
                            <th style={{ padding: '1rem' }}>신고일</th>
                            <th style={{ padding: '1rem' }}>처리자</th>
                            <th style={{ padding: '1rem' }}>상태</th>
                            <th style={{ padding: '1rem' }}>관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {displayReports.map((report) => (
                            <tr key={report.reportId}
                                onClick={() => handleReportClick(report.reportId)}
                                style={{
                                    borderTop: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <td style={{ padding: '1rem' }}>{report.reportId}</td>
                                <td style={{ padding: '1rem' }}>{getTypeText(report.reportedType)}</td>
                                <td style={{ padding: '1rem' }}>{report.reportedId}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {report.reason}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    {formatDate(report.createdAt)}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {report.resolvedByName || '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>{getStatusBadge(report.status)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReportClick(report.reportId);
                                        }}
                                        style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.875rem',
                                            cursor: 'pointer',
                                            fontWeight: '500'
                                        }}
                                    >
                                        상세보기
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {displayReports.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                    }}>
                        {search || statusFilter ? '검색 결과가 없습니다.' : '신고 내역이 없습니다.'}
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

export default ReportManagePage;