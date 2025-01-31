import React, { useEffect, useState } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { useChat } from '../hooks/useChat';
import { Mic, MicOff, Settings } from 'lucide-react';

export const ChatInput = ({ inputRef, onSend, onKeyDown, disabled }) => {
  const { isListening, transcript, startListening, stopListening, availableDevices, selectedDevice, selectDevice, error } = useSpeech();
  const { chat } = useChat();
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

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

  const handleMicClick = async () => {
    if (error) {
      alert(error);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex flex-col gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <div className="flex items-center gap-2">
        <input
          className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
          placeholder="Type message..."
          ref={inputRef}
          onKeyDown={onKeyDown}
        />
        
        <div className="relative">
          <button
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            className="bg-blue-400 hover:bg-blue-500 text-white p-4 rounded-md focus:ring-4 focus:ring-blue-300 shadow-lg shadow-blue-400/50"
            title="Audio Settings"
          >
            <Settings className="w-6 h-6" />
          </button>

          {showDeviceSelector && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-lg p-2 z-50">
              <h3 className="text-gray-800 font-semibold mb-2 px-2">Select Microphone</h3>
              {availableDevices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    selectDevice(device.deviceId);
                    setShowDeviceSelector(false);
                  }}
                  className={`w-full text-left px-2 py-1 rounded ${
                    selectedDevice?.deviceId === device.deviceId
                      ? 'bg-blue-100 text-blue-800'
                      : 'hover:bg-gray-100 text-gray-800'
                  }`}
                >
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleMicClick}
          className={`bg-blue-400 hover:bg-blue-500 text-white p-4 rounded-md focus:ring-4 focus:ring-blue-300 shadow-lg shadow-blue-400/50 ${
            isListening ? 'bg-red-500 hover:bg-red-600' : ''
          }`}
          title={isListening ? 'Stop recording' : 'Start recording'}
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
    </div>
  );
};