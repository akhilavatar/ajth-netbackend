import { useState, useEffect } from 'react';
import { useChat } from './useChat';

export const useAudio = () => {
  const [audio, setAudio] = useState();
  const { message, onMessagePlayed } = useChat();

  useEffect(() => {
    if (!message?.audio) return;

    const newAudio = new Audio("data:audio/mp3;base64," + message.audio);
    newAudio.onended = onMessagePlayed;
    newAudio.play();
    setAudio(newAudio);

    return () => {
      if (newAudio) {
        newAudio.pause();
        newAudio.currentTime = 0;
      }
    };
  }, [message]);

  return { audio };
};