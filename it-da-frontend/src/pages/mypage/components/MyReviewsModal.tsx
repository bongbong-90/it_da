import React from 'react';
import './MeetingReviewsModal.css';

// ✅ MyReview 타입과 호환되도록 sentiment를 optional로
interface Review {
    reviewId?: number;
    meetingId: number;
    meetingTitle: string;
    rating: number;
    content: string;
    sentiment?: string;  // ✅ optional로 변경
    createdAt: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    reviews: Review[];
}

const MyReviewsModal: React.FC<Props> = ({ isOpen, onClose, reviews }) => {

    const getSentimentStyle = (sentiment?: string) => {
        const s = (sentiment || '').toLowerCase();
        if (s.includes('pos') || s.includes('긍정')) {
            return { emoji: '😊', label: '긍정', bg: '#e8f5e9', color: '#2e7d32' };
        }
        if (s.includes('neg') || s.includes('부정')) {
            return { emoji: '😔', label: '부정', bg: '#ffebee', color: '#c62828' };
        }
        return { emoji: '😐', label: '보통', bg: '#fff3e0', color: '#ef6c00' };
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
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    // 평균 평점 계산
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    if (!isOpen) return null;

    return (
        <div className="meeting-reviews-overlay" onClick={onClose}>
            <div className="meeting-reviews-modal my-reviews-modal" onClick={e => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="mrm-header my-reviews-header">
                    <h2>✨ 내가 쓴 후기</h2>
                    <button className="mrm-close" onClick={onClose}>✕</button>
                </div>

                {/* 요약 */}
                <div className="my-reviews-summary">
                    <div className="summary-box">
                        <span className="summary-number">{reviews.length}</span>
                        <span className="summary-label">작성한 후기</span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-box">
                        <span className="summary-number">{avgRating.toFixed(1)}</span>
                        <span className="summary-label">평균 평점</span>
                    </div>
                </div>

                {/* 리뷰 목록 */}
                <div className="mrm-content">
                    {reviews.length === 0 ? (
                        <div className="mrm-empty">
                            <span className="mrm-empty-icon">📭</span>
                            <p>작성한 후기가 없습니다</p>
                        </div>
                    ) : (
                        <div className="mrm-review-list">
                            {reviews.map((review, index) => {
                                const sentiment = getSentimentStyle(review.sentiment);
                                return (
                                    <div key={review.reviewId || `${review.meetingId}-${index}`} className="mrm-review-card my-review-card">
                                        <div className="mrm-card-header">
                                            <div className="my-review-meeting">
                                                <span className="meeting-emoji">🎯</span>
                                                <span className="meeting-name">{review.meetingTitle}</span>
                                            </div>
                                            <div
                                                className="mrm-sentiment"
                                                style={{ backgroundColor: sentiment.bg, color: sentiment.color }}
                                            >
                                                {sentiment.emoji} {sentiment.label}
                                            </div>
                                        </div>
                                        <div className="mrm-rating-row">
                                            <span className="mrm-rating">{renderStars(review.rating)}</span>
                                            <span className="mrm-date">{formatDate(review.createdAt)}</span>
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

export default MyReviewsModal;
