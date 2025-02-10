import React, { useRef } from 'react';
import { useChat } from "../hooks/useChat";
import { useAvatar } from "../hooks/useAvatar";
import { useKeyboardControls } from "../hooks/useKeyboardControls";
import { Header } from "./Header";
import { ChatInput } from "./ChatInput";
import { ChatHistory } from "./ChatHistory";
import { ChatButton } from "./UI/ChatButton";
import { useLocation } from 'react-router-dom';

export const UI = ({ hidden }) => {
  const input = useRef();
  const { chat, loading, message } = useChat();
  const { showAvatar, setShowAvatar } = useAvatar();
  const location = useLocation();
  
  useKeyboardControls();

  // Hide avatar chat on certain pages
  const hideOnPaths = ['/login', '/signup'];
  if (hideOnPaths.includes(location.pathname)) return null;

  const sendMessage = () => {
    const text = input.current?.value;
    if (text && !loading && !message) {
      chat(text);
      input.current.value = "";
    }
  };

  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {showAvatar ? (
        <div className="w-full h-full absolute top-0 left-0 flex flex-col justify-between p-8">
          <Header onClose={() => setShowAvatar(false)} />
          <ChatHistory />
          <ChatInput 
            inputRef={input}
            onSend={sendMessage}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading || message}
          />
        </div>
      ) : (
        <ChatButton onClick={() => setShowAvatar(true)} />
      )}
    </div>
  );
};