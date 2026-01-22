import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MeetingReviewsModal.css';

interface Review {
    reviewId: number;
    userId: number;
    username: string;
    profileImageUrl: string;
    meetingId: number;
    meetingTitle: string;
    rating: number;
    content: string;
    sentiment: string;
    createdAt: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    meetingId: number | null;
    meetingTitle: string;
}

const MeetingReviewsModal: React.FC<Props> = ({ isOpen, onClose, meetingId, meetingTitle }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [avgRating, setAvgRating] = useState(0);

    useEffect(() => {
        if (isOpen && meetingId) {
            fetchReviews();
        }
    }, [isOpen, meetingId]);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8080/api/reviews/meeting/${meetingId}`,
                { withCredentials: true }
            );
            setReviews(response.data);

            if (response.data.length > 0) {
                const avg = response.data.reduce((sum: number, r: Review) => sum + r.rating, 0) / response.data.length;
                setAvgRating(avg);
            } else {
                setAvgRating(0);
            }
        } catch (err) {
            console.error('리뷰 조회 실패:', err);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    const getSentimentStyle = (sentiment: string) => {
        switch (sentiment) {
            case 'POSITIVE': return { emoji: '😊', label: '긍정', bg: '#e8f5e9', color: '#2e7d32' };
            case 'NEGATIVE': return { emoji: '😔', label: '부정', bg: '#ffebee', color: '#c62828' };
            default: return { emoji: '😐', label: '보통', bg: '#fff3e0', color: '#ef6c00' };
        }
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const emptyStars = 5 - fullStars;
        return (
            <span className="stars-display">
                {'★'.repeat(fullStars)}
                {'☆'.repeat(emptyStars)}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="meeting-reviews-overlay" onClick={onClose}>
            <div className="meeting-reviews-modal" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="mrm-header">
                    <h2>📝 모임 리뷰</h2>
                    <button className="mrm-close" onClick={onClose}>✕</button>
                </div>

                {/* 모임 정보 & 평균 평점 */}
                <div className="mrm-meeting-info">
                    <h3 className="mrm-meeting-title">{meetingTitle}</h3>
                    <div className="mrm-avg-rating">
                        {renderStars(avgRating)}
                        <span className="mrm-avg-score">{avgRating.toFixed(1)}</span>
                        <span className="mrm-review-count">({reviews.length}개 리뷰)</span>
                    </div>
                </div>

                {/* 리뷰 목록 */}
                <div className="mrm-content">
                    {loading ? (
                        <div className="mrm-loading">
                            <div className="mrm-spinner"></div>
                            <p>로딩 중...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="mrm-empty">
                            <span className="mrm-empty-icon">📭</span>
                            <p>아직 작성된 리뷰가 없습니다</p>
                        </div>
                    ) : (
                        <div className="mrm-review-list">
                            {reviews.map((review) => {
                                const sentiment = getSentimentStyle(review.sentiment);
                                return (
                                    <div key={review.reviewId} className="mrm-review-card">
                                        <div className="mrm-card-header">
                                            <div className="mrm-user">
                                                <div className="mrm-avatar">
                                                    {review.profileImageUrl ? (
                                                        <img src={review.profileImageUrl} alt={review.username} />
                                                    ) : (
                                                        <span>{review.username.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="mrm-user-info">
                                                    <span className="mrm-username">{review.username}</span>
                                                    <span className="mrm-date">{formatDate(review.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div
                                                className="mrm-sentiment"
                                                style={{ backgroundColor: sentiment.bg, color: sentiment.color }}
                                            >
                                                {sentiment.emoji} {sentiment.label}
                                            </div>
                                        </div>
                                        <div className="mrm-rating">
                                            {renderStars(review.rating)}
                                        </div>
                                        <p className="mrm-text">{review.content}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingReviewsModal;
