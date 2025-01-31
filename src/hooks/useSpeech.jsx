import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition is not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    // Enhanced error handling
    recognition.onerror = async (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed') {
        // Check if microphone permissions are granted
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          if (permissionStatus.state === 'denied') {
            alert('Microphone permission is required. Please enable it in your browser settings.');
          }
        } catch (error) {
          console.error('Error checking microphone permission:', error);
        }
      }
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognition);

    // Get available audio input devices
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAvailableDevices(audioInputs);
        console.log('Available audio input devices:', audioInputs);
      })
      .catch(error => {
        console.error('Error enumerating audio devices:', error);
      });
  }, []);

  const startListening = async () => {
    if (!recognition) {
      console.error('Speech recognition is not initialized');
      return;
    }

    try {
      // Request microphone access first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      recognition.start();
      setIsListening(true);
      setTranscript(''); // Clear previous transcript
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access is required. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        alert('No microphone found. Please connect a microphone and try again.');
      }
    }
  };

  const stopListening = () => {
    if (!recognition) return;

    try {
      recognition.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    availableDevices
  };
};