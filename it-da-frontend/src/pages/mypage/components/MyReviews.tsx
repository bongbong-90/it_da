import React from 'react';
import './MyReviews.css';
import { MyReview } from '../../../api/mypage.api';

interface Props {
    data: MyReview[];
    onOpenModal?: () => void;  // ✅ 모달 열기 prop 추가
}

const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const empty = 5 - full;
    return '★'.repeat(full) + '☆'.repeat(empty);
};

const getSentimentClass = (sentiment: string) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('pos') || s.includes('긍정')) return 'positive';
    if (s.includes('neg') || s.includes('부정')) return 'negative';
    return 'neutral';
};

const getSentimentLabel = (sentiment: string) => {
    const s = (sentiment || '').toLowerCase();
    if (s.includes('pos') || s.includes('긍정')) return '😊 긍정';
    if (s.includes('neg') || s.includes('부정')) return '😔 부정';
    return '😐 보통';
};

const MyReviews: React.FC<Props> = ({ data, onOpenModal }) => {
    return (
        <div className="my-reviews">
            <div className="section-header">
                <h2>✨ 내가 쓴 후기</h2>
                {/* ✅ 전체보기 버튼 추가 */}
                {data.length > 0 && onOpenModal && (
                    <button className="view-all-btn" onClick={onOpenModal}>
                        전체보기 →
                    </button>
                )}
            </div>

            {data.length === 0 ? (
                <p className="empty-message">아직 작성한 후기가 없습니다.</p>
            ) : (
                <div className="reviews-list">
                    {/* ✅ 최대 3개만 미리보기로 표시 */}
                    {data.slice(0, 3).map((review) => {
                        const sentimentClass = getSentimentClass(review.sentiment);
                        return (
                            <div
                                key={`${review.meetingId}-${review.createdAt}`}
                                className="review-card"
                                onClick={onOpenModal}
                                style={{ cursor: onOpenModal ? 'pointer' : 'default' }}
                            >
                                <div className="review-header">
                                    <h3>{review.meetingTitle}</h3>
                                    <div className="rating">{renderStars(review.rating)}</div>
                                </div>

                                <p className="review-text">{review.content}</p>

                                <div className="review-meta">
                                    <span className="review-date">{review.createdAt}</span>
                                    <span className={`sentiment-badge ${sentimentClass}`}>
                                        {getSentimentLabel(review.sentiment)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* ✅ 3개 이상이면 더보기 안내 */}
                    {data.length > 3 && onOpenModal && (
                        <button className="more-reviews-btn" onClick={onOpenModal}>
                            +{data.length - 3}개 더 보기
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyReviews;
