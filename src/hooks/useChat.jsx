import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useContentStore } from "../store/content";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
const ELEVEN_LABS_API_KEY = "sk_1bf26f5f2ac6e9712644981e24fa71e9ee1ed7178fd885e7";
const VOICE_ID = "xctasy8XvGp2cVO9HL9k";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const ChatContext = createContext();

const fetchWithRetry = async (url, options, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
};

export const ChatProvider = ({ children }) => {
  const { setContentType } = useContentStore();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  
  const synthesizeSpeech = async (text, retryCount = 0) => {
    if (!ELEVEN_LABS_API_KEY || !VOICE_ID) {
      console.warn('Speech synthesis is disabled - missing API key or voice ID');
      return null;
    }

    try {
      const response = await fetchWithRetry(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVEN_LABS_API_KEY
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true
            }
          })
        }
      );

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Speech synthesis failed:', error.message);
      
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return synthesizeSpeech(text, retryCount + 1);
      }
      
      return null;
    }
  };

  const generateLipSync = async (text) => {
    try {
      const phonemes = text.split('').map((char, index) => ({
        value: char.toUpperCase(),
        start: index * 0.1,
        end: (index + 1) * 0.1
      }));

      return {
        mouthCues: phonemes
      };
    } catch (error) {
      console.error('Lip sync generation failed:', error.message);
      return null;
    }
  };

  const checkNetworkConnection = () => {
    return navigator.onLine;
  };

  const chat = async (message) => {
    if (!message?.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!checkNetworkConnection()) {
      toast.error("No internet connection. Please check your network and try again.");
      return;
    }

    setLoading(true);
    try {
      // Add user message to chat history
      setChatHistory(prev => [...prev, { role: 'user', content: message }]);

      // Check for greeting
      if (message.toLowerCase().includes('hi netflix')) {
        const response = "Hi! How can I help you today?";
        const audioUrl = await synthesizeSpeech(response);
        const lipsync = await generateLipSync(response);
        
        setMessages([{
          text: response,
          audio: audioUrl,
          lipsync
        }]);
        
        setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        return;
      }

      // Handle search queries
      if (message.toLowerCase().includes('search') || message.toLowerCase().includes('find')) {
        const searchTerm = message.replace(/search|find|for/gi, '').trim();
        
        try {
          // Try searching in movies first
          const movieRes = await axios.get(`/api/v1/search/movie/${searchTerm}`);
          if (movieRes.data.content.length > 0) {
            setContentType('movie');
            const content = movieRes.data.content[0];
            const response = `I found "${content.title}". Would you like to watch it?`;
            
            const audioUrl = await synthesizeSpeech(response);
            const lipsync = await generateLipSync(response);
            
            setMessages([{
              text: response,
              searchResult: content,
              type: 'movie',
              audio: audioUrl,
              lipsync
            }]);
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
            return;
          }

          // If no movies found, try TV shows
          const tvRes = await axios.get(`/api/v1/search/tv/${searchTerm}`);
          if (tvRes.data.content.length > 0) {
            setContentType('tv');
            const content = tvRes.data.content[0];
            const response = `I found "${content.name}". Would you like to watch it?`;
            
            const audioUrl = await synthesizeSpeech(response);
            const lipsync = await generateLipSync(response);
            
            setMessages([{
              text: response,
              searchResult: content,
              type: 'tv',
              audio: audioUrl,
              lipsync
            }]);
            
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
            return;
          }
        } catch (error) {
          console.error('Search error:', error.message);
          const errorResponse = "Sorry, I couldn't perform the search right now. Please try again later.";
          const audioUrl = await synthesizeSpeech(errorResponse);
          const lipsync = await generateLipSync(errorResponse);
          
          setMessages([{
            text: errorResponse,
            audio: audioUrl,
            lipsync
          }]);
          
          setChatHistory(prev => [...prev, { role: 'assistant', content: errorResponse }]);
          return;
        }

        const notFoundResponse = "I couldn't find any movies or TV shows matching your search. Please try a different search term.";
        const audioUrl = await synthesizeSpeech(notFoundResponse);
        const lipsync = await generateLipSync(notFoundResponse);
        
        setMessages([{
          text: notFoundResponse,
          audio: audioUrl,
          lipsync
        }]);
        
        setChatHistory(prev => [...prev, { role: 'assistant', content: notFoundResponse }]);
        return;
      }

      // If it's a "yes" response to watching content
      if (message.toLowerCase().includes('yes') && messages[0]?.searchResult) {
        const content = messages[0].searchResult;
        const response = `Great! Taking you to watch ${content.title || content.name}.`;
        const audioUrl = await synthesizeSpeech(response);
        const lipsync = await generateLipSync(response);
        
        setMessages([{
          text: response,
          audio: audioUrl,
          lipsync
        }]);
        
        setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
        
        navigate(`/watch/${content.id}`);
        return;
      }

      // Default chat response
      try {
        const data = await fetchWithRetry(`${backendUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });
        
        const resp = await data.json();
        
        // Generate speech and lipsync for each message
        const messagesWithAudio = await Promise.all(
          resp.messages.map(async (msg) => {
            const audioUrl = await synthesizeSpeech(msg.text);
            const lipsync = await generateLipSync(msg.text);
            return {
              ...msg,
              audio: audioUrl,
              lipsync
            };
          })
        );
        
        setMessages(messagesWithAudio);
        
        setChatHistory(prev => [
          ...prev,
          ...messagesWithAudio.map(msg => ({
            role: 'assistant',
            content: msg.text
          }))
        ]);
      } catch (error) {
        throw new Error(`Chat request failed: ${error.message}`);
      }
      
    } catch (error) {
      console.error('Chat error:', error.message);
      const errorMessage = "I'm sorry, I encountered an error. Please check your internet connection and try again.";
      
      const audioUrl = await synthesizeSpeech(errorMessage);
      const lipsync = await generateLipSync(errorMessage);
      
      if (!audioUrl) {
        toast.error("Failed to generate speech. Please check your internet connection.");
      }
      
      setMessages([{
        text: errorMessage,
        audio: audioUrl,
        lipsync
      }]);
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

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
        chatHistory
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