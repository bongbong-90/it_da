import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../../api/admin.api';
import type { DashboardResponse } from '../../types/admin.types';

const AdminDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await getDashboard();
            setData(response);
        } catch (err: any) {
            console.error('대시보드 조회 실패:', err);
            setError('대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // ✅ 상태별 색상 함수 추가
    const getUserStatusBadge = (status: string) => {
        const statusConfig: any = {
            ACTIVE: { bg: '#d1fae5', color: '#065f46', text: 'ACTIVE' },
            SUSPENDED: { bg: '#fef3c7', color: '#92400e', text: 'SUSPENDED' },
            DELETED: { bg: '#fee2e2', color: '#991b1b', text: 'DELETED' },
        };
        const config = statusConfig[status] || statusConfig.ACTIVE;

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

    // ✅ 카테고리별 색상 함수 추가
    const getCategoryBadge = (categoryName: string) => {
        const categoryConfig: any = {
            '맛집': { bg: '#fef3c7', color: '#92400e' },
            '피라미디어': { bg: '#dbeafe', color: '#1e40af' },
            '스포츠': { bg: '#dcfce7', color: '#166534' },
            '요가': { bg: '#fce7f3', color: '#9f1239' },
            '소셜': { bg: '#e0e7ff', color: '#3730a3' },
            '당구': { bg: '#f3e8ff', color: '#6b21a8' },
            '스터디': { bg: '#fed7aa', color: '#9a3412' },
            '재테크': { bg: '#d1fae5', color: '#065f46' },
            '운동': { bg: '#bfdbfe', color: '#1e40af' },
        };
        const config = categoryConfig[categoryName] || { bg: '#f3f4f6', color: '#374151' };

        return (
            <span style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: config.bg,
                color: config.color,
                borderRadius: '0.25rem',
                fontSize: '0.75rem',
                fontWeight: '500'
            }}>
                {categoryName}
            </span>
        );
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '16rem' }}>
                <div style={{ fontSize: '1.25rem' }}>로딩 중...</div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div style={{ padding: '1.5rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.5rem' }}>
                {error || '데이터를 불러올 수 없습니다.'}
            </div>
        );
    }

    const { dashboard, recentUsers, recentMeetings } = data;

    const stats = [
        {
            label: '전체 회원',
            value: dashboard.totalUsersCount.toLocaleString(),
            change: dashboard.userGrowthRate,
            bgColor: '#3b82f6',
            path: '/admin/users',
        },
        {
            label: '활성 모임',
            value: dashboard.activeMeetingsCount.toLocaleString(),
            change: dashboard.meetingGrowthRate,
            bgColor: '#10b981',
            path: '/admin/meetings',
        },
        {
            label: '대기 신고',
            value: dashboard.pendingReportsCount.toLocaleString(),
            change: 0,
            bgColor: '#ef4444',
            path: '/admin/reports',
        },
        {
            label: '오늘 가입',
            value: dashboard.todayJoinedUsersCount.toLocaleString(),
            change: 0,
            bgColor: '#8b5cf6',
            path: '/admin/users',
        },
        {
            label: '1:1 문의 대기',
            value: dashboard.pendingInquiriesCount.toLocaleString(),
            change: 0,
            bgColor: '#f59e0b',
            path: '/admin/inquiries',
        },
    ];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    };

    return (
        <div>
            {/* 통계 카드 */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(stat.path)}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '1.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
                                    {stat.value}
                                </p>
                                {stat.change !== 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                                        {stat.change > 0 ? (
                                            <>
                                                <span style={{ color: '#10b981', marginRight: '0.25rem' }}>↗</span>
                                                <p style={{ fontSize: '0.875rem', color: '#10b981' }}>
                                                    +{stat.change.toFixed(1)}% vs 지난주
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ color: '#ef4444', marginRight: '0.25rem' }}>↘</span>
                                                <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>
                                                    {stat.change.toFixed(1)}% vs 지난주
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                width: '3rem',
                                height: '3rem',
                                backgroundColor: stat.bgColor,
                                borderRadius: '0.5rem',
                                opacity: 0.2
                            }}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 최근 활동 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {/* 최근 가입 회원 */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>최근 가입 회원</h3>
                    </div>
                    <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                        {recentUsers.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                                    <th style={{ paddingBottom: '0.75rem' }}>이름</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>이메일</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>가입일</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>상태</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentUsers.map((user) => (
                                    <tr
                                        key={user.userId}
                                        onClick={() => navigate(`/admin/users/${user.userId}`)}
                                        style={{
                                            borderTop: '1px solid #e5e7eb',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <td style={{ padding: '0.75rem 0' }}>{user.username}</td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {user.email}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            {getUserStatusBadge(user.status)}  {/* ✅ 함수 호출로 변경 */}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                최근 가입한 회원이 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                {/* 최근 생성 모임 */}
                <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>최근 생성 모임</h3>
                    </div>
                    <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                        {recentMeetings.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                <tr style={{ textAlign: 'left', fontSize: '0.875rem', color: '#6b7280' }}>
                                    <th style={{ paddingBottom: '0.75rem' }}>모임명</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>카테고리</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>인원</th>
                                    <th style={{ paddingBottom: '0.75rem' }}>생성일</th>
                                </tr>
                                </thead>
                                <tbody>
                                {recentMeetings.map((meeting) => (
                                    <tr
                                        key={meeting.meetingId}
                                        onClick={() => navigate(`/admin/meetings/${meeting.meetingId}`)}
                                        style={{
                                            borderTop: '1px solid #e5e7eb',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <td style={{ padding: '0.75rem 0' }}>{meeting.title}</td>
                                        <td style={{ padding: '0.75rem 0' }}>
                                            {getCategoryBadge(meeting.categoryName)}  {/* ✅ 함수 호출로 변경 */}
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {meeting.currentMembers}명
                                        </td>
                                        <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: '#4b5563' }}>
                                            {formatDate(meeting.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>
                                최근 생성된 모임이 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;