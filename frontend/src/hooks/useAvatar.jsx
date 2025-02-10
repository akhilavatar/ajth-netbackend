import { createContext, useContext, useState, useEffect } from 'react';

const AvatarContext = createContext();

const getInitialState = () => {
  try {
    const saved = localStorage.getItem('showAvatar');
    return saved !== null ? JSON.parse(saved) : true;
  } catch {
    return true;
  }
};

export const AvatarProvider = ({ children }) => {
  const [showAvatar, setShowAvatar] = useState(getInitialState);

  const toggleAvatar = (value) => {
    const newValue = typeof value === 'boolean' ? value : !showAvatar;
    setShowAvatar(newValue);
    try {
      localStorage.setItem('showAvatar', JSON.stringify(newValue));
    } catch (error) {
      console.error('Failed to save avatar state:', error);
    }
  };

  return (
    <AvatarContext.Provider value={{ showAvatar, setShowAvatar: toggleAvatar }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar must be used within an AvatarProvider');
  }
  return context;
};