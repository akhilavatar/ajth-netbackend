import { useState, useEffect } from 'react';
import { useChat } from './useChat';
import { useAudio } from './useAudio';
import { visemeMap } from '../constants/facialExpressions';

export const useLipSync = () => {
  const [currentViseme, setCurrentViseme] = useState(null);
  const { message } = useChat();
  const { audio } = useAudio();

  useEffect(() => {
    if (!audio || !message?.text) {
      setCurrentViseme(null);
      return;
    }

    let lastViseme = null;
    let transitionTimer = null;

    const updateMouthShape = () => {
      if (!audio.duration || audio.paused) {
        setCurrentViseme(null);
        return;
      }

      // Calculate viseme based on current playback position
      const progress = audio.currentTime / audio.duration;
      const textLength = message.text.length;
      const currentCharIndex = Math.floor(progress * textLength);
      
      if (currentCharIndex < textLength) {
        const currentChar = message.text[currentCharIndex].toUpperCase();
        const targetViseme = visemeMap[currentChar] || 'viseme_sil';

        if (targetViseme !== lastViseme) {
          if (transitionTimer) clearTimeout(transitionTimer);
          
          setCurrentViseme(targetViseme);
          lastViseme = targetViseme;

          // Smooth transition
          transitionTimer = setTimeout(() => {
            setCurrentViseme('viseme_sil');
          }, 50);
        }
      } else {
        setCurrentViseme('viseme_sil');
      }
    };

    const intervalId = setInterval(updateMouthShape, 1000 / 60);

    audio.addEventListener('ended', () => {
      setCurrentViseme('viseme_sil');
    });

    return () => {
      clearInterval(intervalId);
      if (transitionTimer) clearTimeout(transitionTimer);
      setCurrentViseme('viseme_sil');
    };
  }, [audio, message]);

  return { currentViseme };
};