import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types/chat.types';

interface Props {
    message: ChatMessageType;
    isMine: boolean;
}

const ChatMessage: React.FC<Props> = ({ message, isMine }) => {
    return (
        <div className={`flex gap-3 mb-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
            {!isMine && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm">
                    {message.senderName[0]}
                </div>
            )}

            <div className={`max-w-[75%] ${isMine ? 'flex flex-col items-end' : ''}`}>
                {!isMine && <div className="text-xs font-bold mb-1 text-gray-600 ml-1">{message.senderName}</div>}

                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm break-all leading-relaxed ${
                    isMine
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                    {message.content}
                </div>

                <div className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;