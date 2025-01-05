import { useState, useEffect } from 'react';
import { useChat } from './useChat';
import { useAudio } from './useAudio';

const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

export const useLipSync = () => {
  const [currentViseme, setCurrentViseme] = useState(null);
  const { message } = useChat();
  const { audio } = useAudio();

  useEffect(() => {
    if (!audio || !message?.lipsync) return;

    const updateMouthShape = () => {
      const currentTime = audio.currentTime;
      const currentCue = message.lipsync.mouthCues.find(
        cue => currentTime >= cue.start && currentTime <= cue.end
      );

      if (currentCue) {
        setCurrentViseme(corresponding[currentCue.value]);
      } else {
        setCurrentViseme(null);
      }
    };

    const intervalId = setInterval(updateMouthShape, 1000 / 60); // 60fps update

    return () => {
      clearInterval(intervalId);
      setCurrentViseme(null);
    };
  }, [audio, message]);

  return { currentViseme };
};