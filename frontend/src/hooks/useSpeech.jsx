import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      
      // Make recognition more responsive
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Increase sensitivity
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        setTranscript(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const startListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
  };
};