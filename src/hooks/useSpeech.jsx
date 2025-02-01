import { useState, useEffect } from 'react';

export const useSpeech = () => {
  const [recognition, setRecognition] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [audioContext, setAudioContext] = useState(null);

  const initializeAudioContext = () => {
    if (audioContext) {
      audioContext.close();
    }
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(ctx);
    return ctx;
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const createRecognition = () => {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onerror = async (event) => {
        console.error('Speech recognition error:', event.error);
        
        if (event.error === 'no-speech') {
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
    const ctx = initializeAudioContext();

    const detectDevices = async (retryCount = 0) => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length === 0 && retryCount < 3) {
          setTimeout(() => detectDevices(retryCount + 1), 1000);
          return;
        }
        
        setAvailableDevices(audioInputs);
        console.log('Available audio input devices:', audioInputs);

        // Prefer Bluetooth devices
        const bluetoothDevice = audioInputs.find(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('wireless')
        );

        if (bluetoothDevice) {
          await verifyAndSelectDevice(bluetoothDevice, ctx);
        } else {
          // Try each device until we find one that works
          for (const device of audioInputs) {
            if (await verifyAndSelectDevice(device, ctx)) {
              break;
            }
          }
        }
      } catch (error) {
        console.error('Error detecting audio devices:', error);
        setError('Error detecting audio devices. Please check your microphone connection.');
      }
    };

    detectDevices();

    const handleDeviceChange = async () => {
      await detectDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const verifyAndSelectDevice = async (device, context) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000, // Higher sample rate for better quality
          channelCount: 1 // Mono for better speech recognition
        }
      });

      const isWorking = await testAudioInput(stream, context);
      if (isWorking) {
        setSelectedDevice(device);
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
    } catch (err) {
      console.warn(`Device ${device.label} not working:`, err);
    }
    return false;
  };

  const testAudioInput = async (stream, context, timeout = 2000) => {
    return new Promise((resolve) => {
      try {
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let detectionTimer = null;
        let detected = false;

        const checkLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          // Use a more sophisticated detection method
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const peak = Math.max(...dataArray);
          
          if (average > 5 || peak > 20) { // More sensitive thresholds
            detected = true;
            clearInterval(intervalId);
            clearTimeout(detectionTimer);
            resolve(true);
          }
        };

        const intervalId = setInterval(checkLevel, 50); // Check more frequently
        
        detectionTimer = setTimeout(() => {
          clearInterval(intervalId);
          resolve(detected);
        }, timeout);
      } catch (err) {
        console.error('Error in testAudioInput:', err);
        resolve(false);
      }
    });
  };

  const startListening = async () => {
    if (!recognition) {
      setError('Speech recognition is not initialized');
      return;
    }

    try {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Reinitialize audio context to handle device switches
      const ctx = initializeAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedDevice ? {
          deviceId: { exact: selectedDevice.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        } : true
      });

      // Test with longer timeout for Bluetooth devices
      const timeout = selectedDevice?.label.toLowerCase().includes('bluetooth') ? 5000 : 3000;
      const hasAudio = await testAudioInput(stream, ctx, timeout);
      
      if (!hasAudio) {
        throw new Error(
          'No audio input detected. Please check:\n' +
          '1. Your microphone is not muted\n' +
          '2. You are speaking into the microphone\n' +
          '3. The correct audio device is selected'
        );
      }

      setAudioStream(stream);
      recognition.start();
      setIsListening(true);
      setTranscript('');
      setError(null);

    } catch (error) {
      console.error('Error starting speech recognition:', error);
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError(error.message || 'Failed to start speech recognition');
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
      if (isListening) {
        stopListening();
      }
      
      // Reinitialize audio context for new device
      const ctx = initializeAudioContext();
      
      // Verify the new device works
      const works = await verifyAndSelectDevice(device, ctx);
      if (!works) {
        setError('Selected device is not working. Please try another device.');
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