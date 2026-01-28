import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInquiriesPaged } from '../../api/admin.api';
import type { InquiryResponse, InquiryStatus, InquiryCategory } from '../../types/admin.types';

const InquiryManagePage: React.FC = () => {
    const navigate = useNavigate();
    const [allInquiries, setAllInquiries] = useState<InquiryResponse[]>([]);
    const [filteredInquiries, setFilteredInquiries] = useState<InquiryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');

    useEffect(() => {
        fetchInquiries();
    }, [page]);

    useEffect(() => {
        applyFilters();
    }, [search, statusFilter, categoryFilter, allInquiries]);

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const params: any = {
                page: page,
                size: 10,
            };

            const data = await getInquiriesPaged(params);
            setAllInquiries(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('문의 목록 조회 실패:', error);
            alert('문의 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...allInquiries];

        // 상태 필터
        if (statusFilter) {
            filtered = filtered.filter(inquiry => inquiry.status === statusFilter);
        }

        // 카테고리 필터
        if (categoryFilter) {
            filtered = filtered.filter(inquiry => inquiry.category === categoryFilter);
        }

        // 검색 필터
        if (search.trim()) {
            const searchLower = search.toLowerCase().trim();
            filtered = filtered.filter(inquiry =>
                inquiry.inquiryId.toString().includes(searchLower) ||
                inquiry.title.toLowerCase().includes(searchLower) ||
                inquiry.username.toLowerCase().includes(searchLower) ||
                inquiry.email.toLowerCase().includes(searchLower)
            );
        }

        setFilteredInquiries(filtered);
    };

    const handleSearch = () => {
        applyFilters();
    };

    const handleInquiryClick = (inquiryId: number) => {
        navigate(`/admin/inquiries/${inquiryId}`);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR');
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

    const getCategoryText = (category: InquiryCategory): string => {
        const categoryMap: Record<InquiryCategory, string> = {
            ACCOUNT: '계정',
            MEETING: '모임',
            PAYMENT: '결제',
            BUG: '버그',
            SUGGESTION: '제안',
            ETC: '기타'
        };
        return categoryMap[category] || category;
    };

    if (loading && allInquiries.length === 0) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    const displayInquiries = filteredInquiries;
    const displayTotal = filteredInquiries.length;

    return (
        <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                1:1 문의 관리
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
                        placeholder="문의 번호, 제목, 작성자 검색"
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
                    {(search || statusFilter || categoryFilter) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setStatusFilter('');
                                setCategoryFilter('');
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

            {/* 문의 목록 */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                            전체 문의 ({displayTotal}건)
                            {search && <span style={{ fontSize: '0.875rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                검색: "{search}"
                            </span>}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
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
                                <option value="">전체 카테고리</option>
                                <option value="ACCOUNT">계정</option>
                                <option value="MEETING">모임</option>
                                <option value="PAYMENT">결제</option>
                                <option value="BUG">버그</option>
                                <option value="SUGGESTION">제안</option>
                                <option value="ETC">기타</option>
                            </select>
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
                                <option value="">전체 상태</option>
                                <option value="PENDING">대기</option>
                                <option value="ANSWERED">답변완료</option>
                                <option value="CLOSED">종료</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>카테고리</th>
                            <th style={{ padding: '1rem' }}>제목</th>
                            <th style={{ padding: '1rem' }}>작성자</th>
                            <th style={{ padding: '1rem' }}>문의일</th>
                            <th style={{ padding: '1rem' }}>답변자</th>
                            <th style={{ padding: '1rem' }}>상태</th>
                            <th style={{ padding: '1rem' }}>관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {displayInquiries.map((inquiry) => (
                            <tr key={inquiry.inquiryId}
                                onClick={() => handleInquiryClick(inquiry.inquiryId)}
                                style={{
                                    borderTop: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <td style={{ padding: '1rem' }}>{inquiry.inquiryId}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {getCategoryText(inquiry.category)}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {inquiry.title}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {inquiry.username}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                    {formatDate(inquiry.createdAt)}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {inquiry.answeredByName || '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>{getStatusBadge(inquiry.status)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleInquiryClick(inquiry.inquiryId);
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
                                        {inquiry.status === 'PENDING' ? '답변하기' : '상세보기'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {displayInquiries.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#6b7280',
                        fontSize: '0.875rem'
                    }}>
                        {search || statusFilter || categoryFilter ? '검색 결과가 없습니다.' : '문의 내역이 없습니다.'}
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

export default InquiryManagePage;