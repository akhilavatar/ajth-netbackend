import React from 'react';
import { useChat } from '../hooks/useChat';

export const ChatHistory = () => {
  const { chatHistory } = useChat();
  const chatContainerRef = React.useRef();

  React.useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 pointer-events-auto"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {chatHistory.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
    </div>
  );
};