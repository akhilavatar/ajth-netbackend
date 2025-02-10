import { useState, useEffect, useRef } from 'react';
import { useChat } from './useChat';

export const useAudio = () => {
  const [audio, setAudio] = useState(null);
  const { message } = useChat();
  const audioRef = useRef(null);

  useEffect(() => {
    if (!message?.audio) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudio(null);
      return;
    }

    const newAudio = new Audio(message.audio);
    audioRef.current = newAudio;
    setAudio(newAudio);

    newAudio.addEventListener('canplaythrough', () => {
      newAudio.play().catch(console.error);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setAudio(null);
    };
  }, [message]);

  return { audio };
};