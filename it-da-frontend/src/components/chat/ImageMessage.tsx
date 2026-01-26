import React, {useState} from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import './ChatMessage.css';

interface ImageMessageProps {
    message: ChatMessage;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ message }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            {/* 1. 채팅창에 보이는 작은 이미지 */}
            <div className="chat-image-wrapper">
                <img
                    src={message.content} // uploads 경로
                    alt="전송된 이미지"
                    className="chat-img-content" // ChatMessage.css에 정의된 스타일 사용
                    onClick={() => setIsModalOpen(true)} // 클릭 시 모달 열기
                    style={{ cursor: 'zoom-in' }}
                />
            </div>

            {/* 2. 화면 꽉 차게 보이는 확대 모달 */}
            {isModalOpen && (
                <div className="image-full-modal" onClick={() => setIsModalOpen(false)}>
                    {/* 선명하게 보이기 위해 transform, filter 제거된 클래스 사용 */}
                    <img
                        src={message.content}
                        alt="확대 이미지"
                        className="full-image-content"
                        onClick={(e) => e.stopPropagation()} // 이미지 클릭 시 닫힘 방지
                    />
                    <span className="close-x" onClick={() => setIsModalOpen(false)}>×</span>
                </div>
            )}
        </>
    );
};
export default ImageMessage;