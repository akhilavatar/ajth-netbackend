import { useEffect } from 'react';
import { useAvatar } from './useAvatar';

export const useKeyboardControls = () => {
  const { showAvatar, setShowAvatar } = useAvatar();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.key === 'Escape' || event.key === 'x') && showAvatar) {
        setShowAvatar(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAvatar, setShowAvatar]);
};