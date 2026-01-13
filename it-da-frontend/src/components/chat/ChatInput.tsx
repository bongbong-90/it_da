import React, { useState, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  onShowFeature: (feature: string) => void;
}

const ChatInput: React.FC<Props> = ({ onSend, onShowFeature }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3">
      <div className="flex gap-1.5">
        {["📷", "📊", "📍", "💰"].map((emoji, i) => (
          <button
            key={i}
            onClick={() => onShowFeature(emoji)}
            className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-full hover:bg-gray-100 transition-transform active:scale-90"
          >
            {emoji}
          </button>
        ))}
      </div>
      <input
        className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white outline-none rounded-2xl px-4 py-2 text-sm transition-all"
        placeholder="메시지를 입력하세요..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        disabled={!text.trim()}
        onClick={handleSend}
        className={`w-9 h-9 flex items-center justify-center rounded-full text-white shadow-md transition-all ${
          text.trim()
            ? "bg-indigo-500 hover:scale-110 active:scale-95"
            : "bg-gray-200"
        }`}
      >
        ➤
      </button>
    </div>
  );
};

export default ChatInput;
