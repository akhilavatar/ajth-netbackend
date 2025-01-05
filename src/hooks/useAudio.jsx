import { useState, useEffect } from 'react';
import { useChat } from './useChat';

export const useAudio = () => {
  const [audio, setAudio] = useState(null);
  const { message } = useChat();

  useEffect(() => {
    if (!message?.audio) return;

    const newAudio = new Audio(message.audio);
    setAudio(newAudio);
    newAudio.play();

    return () => {
      newAudio.pause();
      setAudio(null);
    };
  }, [message]);

  return { audio };
};