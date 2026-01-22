// src/components/chat/PollInputModal.tsx
import React, { useState } from "react";
import "./PollInputModal.css";

const PollInputModal = ({ onClose, onSubmit }: any) => {
    const [title, setTitle] = useState("");
    const [options, setOptions] = useState(["", ""]);

    const addOption = () => {
        if (options.length < 5) setOptions([...options, ""]);
    };

    return (
        <div className="modal-overlay">
            <div className="poll-modal">
                <div className="modal-header">
                    <h3>📊 투표 생성하기</h3>
                </div>
                <div className="modal-body">
                    {/* 투표 제목: 선택지 블럭과 동일한 스타일 적용 */}
                    <input
                        className="poll-block-input title-style"
                        placeholder="투표 제목을 입력하세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div className="options-vertical-container">
                        {options.map((opt, idx) => (
                            <input
                                key={idx}
                                className="poll-block-input"
                                placeholder={`선택지 ${idx + 1}`}
                                value={opt}
                                onChange={(e) => {
                                    const newOpts = [...options];
                                    newOpts[idx] = e.target.value;
                                    setOptions(newOpts);
                                }}
                            />
                        ))}
                    </div>

                    {options.length < 5 && (
                        <button className="add-option-highlight-btn" onClick={addOption}>
                            + 선택지 추가
                        </button>
                    )}
                </div>
                <div className="modal-footer">
                    {/* 취소 버튼 크기 조절을 위해 클래스 추가 */}
                    <button className="poll-action-btn cancel" onClick={onClose}>취소</button>
                    <button className="poll-action-btn submit" onClick={() => onSubmit({ title, options })}>
                        생성
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PollInputModal;