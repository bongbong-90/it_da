// src/components/meeting/MeetingGrid.tsx
import { useNavigate } from 'react-router-dom';
import './MeetingGrid.css';

interface MeetingGridProps {
    category?: string | null;
    subcategory?: string | null;
}

interface Meeting {
    id: number;
    title: string;
    location: string;
    date: string;
    time: string;
    participants: string;
    tags: string[];
    rating: number;
    reviews: number;
    daysLeft: number;
    badge?: string;
}

const MeetingGrid = ({ category, subcategory }: MeetingGridProps) => {
    const navigate = useNavigate();

    // 샘플 데이터
    const meetings: Meeting[] = [
        {
            id: 1,
            title: '🏃 주말 등산 모임',
            location: '북한산',
            date: '1/4 (토)',
            time: '08:00',
            participants: '6/8명',
            tags: ['등산', '운동', '새벽'],
            rating: 4.8,
            reviews: 24,
            daysLeft: 1,
            badge: '🔥 인기'
        },
        {
            id: 2,
            title: '⚽ 풋살 같이 해요',
            location: '잠실 체육관',
            date: '1/5 (일)',
            time: '19:00',
            participants: '8/12명',
            tags: ['풋살', '구기종목', '저녁'],
            rating: 4.9,
            reviews: 18,
            daysLeft: 2,
            badge: '🆕 신규'
        },
        {
            id: 3,
            title: '🏊 수영 초급반',
            location: '강남 수영장',
            date: '1/6 (월)',
            time: '20:00',
            participants: '4/6명',
            tags: ['수영', '초급', '평일저녁'],
            rating: 4.7,
            reviews: 15,
            daysLeft: 3
        }
    ];

    return (
        <div className="meeting-grid">
            {meetings.map((meeting) => (
                <div
                    key={meeting.id}
                    className="meeting-card"
                    onClick={() => navigate(`/meeting/${meeting.id}`)}
                >
                    <div className="meeting-image">
                        {meeting.badge && <div className="meeting-badge">{meeting.badge}</div>}
                    </div>
                    <div className="meeting-content">
                        <h3 className="meeting-title">{meeting.title}</h3>
                        <div className="meeting-meta">
                            <div className="meeting-meta-item">📍 {meeting.location}</div>
                            <div className="meeting-meta-item">⏰ {meeting.date} {meeting.time}</div>
                            <div className="meeting-meta-item">👥 {meeting.participants}</div>
                        </div>
                        <div className="meeting-tags">
                            {meeting.tags.map((tag, i) => (
                                <span key={i} className="tag">#{tag}</span>
                            ))}
                        </div>
                        <div className="meeting-stats">
                            <div className="stat-item">
                                <div className="stat-value">{meeting.rating}</div>
                                <div className="stat-label">평점</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">{meeting.reviews}</div>
                                <div className="stat-label">리뷰</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-value">D-{meeting.daysLeft}</div>
                                <div className="stat-label">마감</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MeetingGrid;