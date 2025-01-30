import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useContentStore } from "../store/content";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { setContentType } = useContentStore();
  
  const chat = async (message) => {
    setLoading(true);
    try {
      // First try to search for content
      if (message.toLowerCase().includes('search') || message.toLowerCase().includes('find')) {
        const searchTerm = message.replace(/search|find|for/gi, '').trim();
        
        // Try searching in movies first
        const movieRes = await axios.get(`/api/v1/search/movie/${searchTerm}`);
        if (movieRes.data.content.length > 0) {
          setContentType('movie');
          const content = movieRes.data.content[0];
          setMessages([{
            text: `I found "${content.title}". Would you like to watch it?`,
            searchResult: content,
            type: 'movie'
          }]);
          return;
        }

        // If no movies found, try TV shows
        const tvRes = await axios.get(`/api/v1/search/tv/${searchTerm}`);
        if (tvRes.data.content.length > 0) {
          setContentType('tv');
          const content = tvRes.data.content[0];
          setMessages([{
            text: `I found "${content.name}". Would you like to watch it?`,
            searchResult: content,
            type: 'tv'
          }]);
          return;
        }

        // If nothing found
        setMessages([{
          text: "I couldn't find any movies or TV shows matching your search. Please try a different search term.",
        }]);
        return;
      }

      // If it's a "yes" response to watching content
      if (message.toLowerCase().includes('yes') && messages[0]?.searchResult) {
        const content = messages[0].searchResult;
        // Instead of using navigate, we'll use window.location
        window.location.href = `/watch/${content.id}`;
        setMessages([{
          text: `Great! Taking you to watch ${content.title || content.name}.`
        }]);
        return;
      }

      // Default chat response
      const data = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      const resp = (await data.json()).messages;
      setMessages((messages) => [...messages, ...resp]);
    } catch (error) {
      setMessages([{
        text: "I'm sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};