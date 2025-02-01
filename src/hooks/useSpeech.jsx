import { useState, useEffect, useRef } from 'react';

export const useSpeech = () => {
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const initializeAudioContext = () => {
    try {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    } catch (e) {
      console.error('Error closing AudioContext:', e);
    }
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioContextRef.current;
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please try using Chrome.');
      return;
    }

    const createRecognition = () => {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onerror = async (event) => {
        if (event.error === 'no-speech') {
          if (retryCount < MAX_RETRIES) {
            setRetryCount(prev => prev + 1);
            setTimeout(() => recognitionRef.current?.start(), 100);
          } else {
            setError('No speech detected. Please check your microphone and try again.');
            setIsListening(false);
            setRetryCount(0);
          }
        } else if (event.error === 'not-allowed') {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            if (permissionStatus.state === 'denied') {
              setError('Microphone access is blocked. Please allow microphone access in your browser settings.');
            } else {
              setError('Microphone permission is required. Please allow access when prompted.');
            }
          } catch {
            setError('Unable to access microphone. Please check your browser settings.');
          }
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          setError('No microphone detected. Please connect a microphone and try again.');
          setIsListening(false);
        } else {
          setError(`Speech recognition error: ${event.error}. Please try again.`);
          setIsListening(false);
        }
      };

      recognition.onresult = (event) => {
        setTranscript(event.results[0][0].transcript);
        setError(null);
        setRetryCount(0);
      };

      recognition.onend = () => {
        if (isListening && retryCount < MAX_RETRIES) {
          setTimeout(() => recognitionRef.current?.start(), 500);
          setRetryCount(prev => prev + 1);
        } else {
          setIsListening(false);
          setRetryCount(0);
        }
      };

      recognitionRef.current = recognition;
    };

    createRecognition();
    const ctx = initializeAudioContext();
    detectDevices(ctx);

    const handleDeviceChange = () => detectDevices(audioContextRef.current);
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      try {
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
      } catch (e) {
        console.error('Error closing AudioContext:', e);
      }
    };
  }, []);

  const detectDevices = async (ctx, retry = 0) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      if (audioInputs.length === 0) {
        if (retry < 3) {
          setTimeout(() => detectDevices(ctx, retry + 1), 1000);
        } else {
          setError('No audio input devices found. Please connect a microphone.');
        }
        return;
      }

      setAvailableDevices(audioInputs);

      // Sort devices by priority: Bluetooth/Wireless > Default > Others
      const sortedDevices = audioInputs.sort((a, b) => {
        const aLabel = a.label.toLowerCase();
        const bLabel = b.label.toLowerCase();
        
        // Bluetooth/Wireless devices get highest priority
        const aIsWireless = aLabel.includes('bluetooth') || aLabel.includes('wireless');
        const bIsWireless = bLabel.includes('bluetooth') || bLabel.includes('wireless');
        if (aIsWireless && !bIsWireless) return -1;
        if (!aIsWireless && bIsWireless) return 1;

        // Default device gets second priority
        const aIsDefault = aLabel.includes('default') || a.deviceId === 'default';
        const bIsDefault = bLabel.includes('default') || b.deviceId === 'default';
        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;

        return 0;
      });

      // Try devices in priority order
      let deviceFound = false;
      for (const device of sortedDevices) {
        if (await verifyAndSelectDevice(device, ctx)) {
          deviceFound = true;
          break;
        }
      }

      if (!deviceFound) {
        setError('No working microphone found. Please check your microphone connection and settings.');
      }
    } catch (error) {
      console.error('Error detecting devices:', error);
      setError('Unable to detect audio devices. Please check your microphone connection.');
    }
  };

  const verifyAndSelectDevice = async (device, context) => {
    if (!device) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: device.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      const isWorking = await testAudioInput(stream, context);
      if (isWorking) {
        setSelectedDevice(device);
        console.log(`Selected microphone: ${device.label}`);
        stream.getTracks().forEach(track => track.stop());
        setError(null);
        return true;
      }

      stream.getTracks().forEach(track => track.stop());
      return false;
    } catch (error) {
      console.error('Error verifying device:', error);
      return false;
    }
  };

  const testAudioInput = async (stream, context, timeout = 2000) => {
    return new Promise((resolve) => {
      try {
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let detected = false;
        
        const checkAudio = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const peak = Math.max(...dataArray);
          
          if (average > 5 || peak > 20) {
            detected = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            resolve(true);
          }
        };

        const intervalId = setInterval(checkAudio, 100);
        const timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          resolve(detected);
        }, timeout);
      } catch (error) {
        console.error('Error testing audio input:', error);
        resolve(false);
      }
    });
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not initialized. Please refresh the page.');
      return;
    }

    try {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      const ctx = initializeAudioContext();

      // If no device is selected or current device isn't working, try to find a working device
      if (!selectedDevice || !(await verifyAndSelectDevice(selectedDevice, ctx))) {
        await detectDevices(ctx);
        if (!selectedDevice) {
          throw new Error('No working microphone found. Please check your microphone connection and settings.');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedDevice.deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      if (!(await testAudioInput(stream, ctx))) {
        throw new Error('No audio input detected. Please check your microphone.');
      }

      setAudioStream(stream);
      setRetryCount(0);
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
      setError(null);
    } catch (error) {
      setError(error.message || 'Failed to start speech recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      setAudioStream(null);
      setRetryCount(0);
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
      const ctx = initializeAudioContext();
      await verifyAndSelectDevice(device, ctx);
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