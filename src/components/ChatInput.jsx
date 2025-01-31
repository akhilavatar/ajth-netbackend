import React, { useEffect, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useChat } from '../hooks/useChat';
import { Mic, MicOff } from 'lucide-react';

export const ChatInput = ({ inputRef, onSend, onKeyDown, disabled }) => {
  const { isListening, transcript, startListening, stopListening, availableDevices } = useSpeech();
  const { chat } = useChat();
  const [microphoneError, setMicrophoneError] = useState(null);

  useEffect(() => {
    if (transcript) {
      if (inputRef.current) {
        inputRef.current.value = transcript;
      }
      // Automatically send the transcribed message
      chat(transcript);
      // Clear the input after sending
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [transcript, chat]);

  useEffect(() => {
    // Check if there are any audio input devices
    if (availableDevices.length === 0) {
      setMicrophoneError('No microphone detected. Please connect a microphone.');
    } else {
      setMicrophoneError(null);
    }
  }, [availableDevices]);

  const handleMicClick = async () => {
    if (microphoneError) {
      alert(microphoneError);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
      <input
        className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
        placeholder="Type message..."
        ref={inputRef}
        onKeyDown={onKeyDown}
      />
      <button
        onClick={handleMicClick}
        className={`bg-blue-400 hover:bg-blue-500 text-white p-4 rounded-md focus:ring-4 focus:ring-blue-300 shadow-lg shadow-blue-400/50 ${
          isListening ? 'bg-red-500 hover:bg-red-600' : ''
        } ${microphoneError ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={microphoneError || (isListening ? 'Stop recording' : 'Start recording')}
      >
        {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>
      <button
        disabled={disabled}
        onClick={onSend}
        className={`bg-blue-400 hover:bg-blue-500 text-white p-4 px-10 font-semibold uppercase rounded-md focus:ring-4 focus:ring-blue-300 shadow-lg shadow-blue-400/50 ${
          disabled ? "cursor-not-allowed opacity-30" : ""
        }`}
      >
        Send
      </button>
    </div>
  );
};