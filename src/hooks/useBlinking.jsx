import { useState, useEffect, useRef } from 'react';

export const useBlinking = () => {
  const [blink, setBlink] = useState(false);
  const blinkTimeout = useRef();

  useEffect(() => {
    const handleBlink = () => {
      setBlink(true);
      blinkTimeout.current = setTimeout(() => {
        setBlink(false);
        scheduleNextBlink();
      }, 200);
    };

    const scheduleNextBlink = () => {
      const timeout = setTimeout(handleBlink, Math.random() * 5000 + 2000);
      blinkTimeout.current = timeout;
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimeout.current) {
        clearTimeout(blinkTimeout.current);
      }
    };
  }, []);

  return { blink };
};