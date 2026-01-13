import React from "react";

interface Props {
  content: string;
}

const ChatSystemMessage: React.FC<Props> = ({ content }) => {
  return (
    <div className="flex justify-center my-6">
      <span className="bg-gray-100 px-4 py-2 rounded-full text-xs text-gray-500 font-medium">
        {content}
      </span>
    </div>
  );
};

export default ChatSystemMessage;
