import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [audioStream, setAudioStream] = useState(null);

  useEffect(() => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const createRecognition = () => {
      const recognition = new window.webkitSpeechRecognition();
      // Critical changes to improve recognition
      recognition.continuous = false; // Changed to false to prevent buffering issues
      recognition.interimResults = false; // Changed to false for more reliable results
      recognition.maxAlternatives = 1; // Reduced to get most confident result
      recognition.lang = 'en-US';

      recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
          // Instead of retrying automatically, we'll let the user try again
          setError('No speech detected. Please try again and speak clearly.');
        } else if (event.error === 'not-allowed') {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            if (permissionStatus.state === 'denied') {
              setError('Microphone permission is required. Please enable it in your browser settings.');
            }
          } catch (error) {
            console.error('Error checking microphone permission:', error);
          }
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onaudiostart = () => {
        setError(null);
      };

      return recognition;
    };

    setRecognition(createRecognition());

    // Enhanced device detection
    const detectDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        setAvailableDevices(audioInputs);
        console.log('Available audio input devices:', audioInputs);

        // Auto-select Bluetooth device if available
        const bluetoothDevice = audioInputs.find(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('wireless')
        );

        if (bluetoothDevice) {
          setSelectedDevice(bluetoothDevice);
          console.log('Selected Bluetooth device:', bluetoothDevice);
        } else {
          setSelectedDevice(audioInputs[0]);
        }

      } catch (error) {
        console.error('Error detecting audio devices:', error);
        setError('Error detecting audio devices. Please check your microphone connection.');
      }
    };

    detectDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', detectDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectDevices);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startListening = async () => {
    if (!recognition) {
      setError('Speech recognition is not initialized');
      return;
    }

    try {
      // Stop any existing audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Configure audio constraints
      const constraints = {
        audio: selectedDevice ? {
          deviceId: { exact: selectedDevice.deviceId },
          echoCancellation: false, // Disabled to prevent interference
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100, // Specify standard sample rate
          channelCount: 1 // Mono audio for better recognition
        } : true
      };

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);

      // Create audio context to verify audio input
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      // Verify audio input is working
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      
      if (dataArray.some(value => value > 0)) {
        // Audio input detected, start recognition
        recognition.start();
        setIsListening(true);
        setTranscript('');
        setError(null);
      } else {
        throw new Error('No audio input detected from microphone');
      }

      // Clean up audio context
      setTimeout(() => {
        audioContext.close();
      }, 1000);

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (error.name === 'NotAllowedError') {
        setError('Microphone access is required. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(`Failed to start speech recognition: ${error.message}`);
      }
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognition) return;

    try {
      recognition.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      setAudioStream(null);
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  };

  const selectDevice = async (deviceId) => {
    const device = availableDevices.find(d => d.deviceId === deviceId);
    if (device) {
      setSelectedDevice(device);
      if (isListening) {
        stopListening();
      }
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    availableDevices,
    selectedDevice,
    selectDevice,
    error
  };
};