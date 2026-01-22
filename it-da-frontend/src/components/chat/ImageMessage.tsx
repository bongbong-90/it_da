import React from 'react';
import { ChatMessage } from '@/stores/useChatStore';
import './ImageMessage.css';

interface ImageMessageProps {
    message: ChatMessage;
}

const ImageMessage: React.FC<ImageMessageProps> = ({ message }) => {
    return (
        <div className="chat-image-wrapper">
            <img
                src={message.content} // 백엔드에서 넘겨준 /uploads/... 경로
                alt="전송된 이미지"
                className="chat-img-content"
                onClick={() => window.open(message.content, '_blank')} // 클릭 시 크게 보기
            />
        </div>
    );
};

export default ImageMessage;