import React, { useState } from 'react';
import api from '@/api/axios.config';
import {ChatMessage, useChatStore} from '@/stores/useChatStore.ts';
import './VoteMessage.css';
import { useAuthStore } from "@/stores/useAuthStore.ts";

interface VoteMessageProps {
    message: ChatMessage;
}

const VoteMessage: React.FC<VoteMessageProps> = ({ message:initialMessage }) => {
    const { user: currentUser } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const message = useChatStore(state =>
        state.messages.find(m => m.messageId === initialMessage.messageId) || initialMessage
    );

    const voteData = React.useMemo(() => {
        try {
            if (!message.metadata) return null;
            const parsed = typeof message.metadata === 'string'
                ? JSON.parse(message.metadata)
                : message.metadata;
            return parsed;
        } catch (e) {
            console.error("❌ metadata 파싱 실패:", e);
            return null;
        }
    }, [message.metadata]);

    if (!voteData) {
        return <div style={{padding: '10px', color: 'red'}}>투표 데이터가 없습니다.</div>;
    }

    if (!voteData.options) {
        return <div style={{padding: '10px', color: 'red'}}>투표 옵션이 없습니다.</div>;
    }

    if (!Array.isArray(voteData.options)) {
        return <div style={{padding: '10px', color: 'red'}}>투표 옵션 형식이 잘못되었습니다.</div>;
    }

    if (voteData.options.length === 0) {
        return <div style={{padding: '10px', color: 'red'}}>투표 옵션이 비어있습니다.</div>;
    }

    const vId = voteData.voteId || voteData.id;

    const totalParticipants = voteData.options.reduce((acc: number, opt: any) => {
        const voters = Array.isArray(opt.voterIds) ? opt.voterIds : [];
        return acc + voters.length;
    }, 0);

    const mySelectedOption = voteData.options.find((opt: any) => {
        const voters = Array.isArray(opt.voterIds) ? opt.voterIds : (opt.voters || []);
        return voters.some((v: any) => String(v.userId || v) === String(currentUser?.userId));
    });
    const mySelectedOptionId = mySelectedOption?.optionId || mySelectedOption?.id;

    const handleVote = async (optionId: number) => {
        if (!vId || !optionId || isSubmitting) return;

        const isCancelling = String(mySelectedOptionId) === String(optionId);
        const selectedIds = isCancelling ? [] : [optionId];

        try {
            setIsSubmitting(true);
            console.log("📤 투표 전송:", { vId, optionId });
            await api.post(`/votes/${vId}/cast`, {
                selectedOptionIds: selectedIds
            }, { withCredentials: true });
            console.log(isCancelling ? "✅ 투표 취소 성공" : "✅ 투표 성공");
        } catch (error) {
            console.error("❌ 투표 전송 실패:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    console.log("🎨 렌더링할 옵션 개수:", voteData.options.length);

    return (
        <div className="vote-card-v2 full-width">
            <div className="vote-header-v2">
                <span className="vote-icon">📊</span>
                <h4 className="vote-title">{voteData.title || '제목 없음'}</h4>
            </div>
            <div className="vote-options-list" style={{minHeight: '100px'}}>
                {voteData.options.map((option: any, index: number) => {
                    console.log(`🔍 옵션 ${index}:`, option);

                    const isStringArray = typeof option === 'string';
                    const oId = isStringArray ? index : (option.optionId || option.id || index);
                    const optionContent = isStringArray ? option : (option.content || option.text || `옵션 ${index + 1}`);
                    const isSelected = String(mySelectedOptionId) === String(oId);
                    const currentVoteCount = isStringArray
                        ? 0
                        : (Array.isArray(option.voterIds)
                            ? option.voterIds.length
                            : (option.voteCount || 0));
                    const percentage = totalParticipants > 0
                        ? Math.round((currentVoteCount / totalParticipants) * 100)
                        : 0;

                    return (
                        <div
                            key={`vote-option-${oId}-${index}`}
                            className={`vote-bar-wrapper ${isSelected ? 'selected' : 'unselected'}`}
                            onClick={() => handleVote(oId)}
                        >
                            <div className="vote-option-info">
                                <span className="option-text" style={{color: 'black', fontWeight: 'bold'}}>
                                    {optionContent}
                                </span>
                                {isSelected && <span className="check-mark">✅</span>}
                            </div>
                            <div className="vote-progress-container">
                                <div
                                    className="vote-progress-fill"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: isSelected ? '#6c5ce7' : '#d1d8ff'
                                    }}
                                />
                            </div>
                            <div className="vote-stat-info">
                                <strong>{currentVoteCount}명</strong> ({percentage}%)
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="vote-footer-v2">
                <span>{voteData.isAnonymous ? "익명 투표" : "공개 투표"}</span>
                <span className="dot">·</span>
                <span>총 {totalParticipants}명 참여</span>
            </div>
        </div>
    );
};

export default VoteMessage;