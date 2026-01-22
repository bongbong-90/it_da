import React, { useState } from 'react';
import axios from 'axios';
import './VoteCreateModal.css';

interface VoteCreateModalProps {
    roomId: number;
    onClose: () => void;
}

const VoteCreateModal: React.FC<VoteCreateModalProps> = ({ roomId, onClose }) => {
    const [title, setTitle] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']); // 기본 선택지 2개
    const [isAnonymous, setIsAnonymous] = useState(false);

    const handleAddOption = () => {
        if (options.length < 5) {
            setOptions([...options, '']);
        } else {
            alert("선택지는 최대 5개까지 가능합니다.");
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreateVote = async () => {
        if (!title.trim() || options.some(opt => !opt.trim())) {
            alert("제목과 모든 항목을 입력해주세요.");
            return;
        }

        try {
            await axios.post(`/api/votes/${roomId}`, {
                title,
                options,
                isAnonymous,
                isMultipleChoice: false
            });
            onClose();
        } catch (error) {
            console.error("투표 생성 실패:", error);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="vote-modal">
                <div className="modal-header">
                    <h3>새 투표 만들기</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <input
                        type="text"
                        className="vote-input-title"
                        placeholder="투표 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="option-list">
                        {options.map((opt, idx) => (
                            <input
                                key={idx}
                                type="text"
                                className="vote-input-option"
                                placeholder={`항목 ${idx + 1}`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, e.target.value)}
                            />
                        ))}
                    </div>
                    <button className="add-option-btn" onClick={handleAddOption}>+ 항목 추가</button>
                    <div className="vote-settings">
                        <label>
                            <input
                                type="checkbox"
                                checked={isAnonymous}
                                onChange={() => setIsAnonymous(!isAnonymous)}
                            />
                            익명 투표
                        </label>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>취소</button>
                    <button className="submit-btn" onClick={handleCreateVote}>올리기</button>
                </div>
            </div>
        </div>
    );
};

export default VoteCreateModal;