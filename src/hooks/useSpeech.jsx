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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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
            setTimeout(() => {
              if (recognition && isListening) {
                recognition.start();
              }
            }, 100);
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
          } catch (error) {
            setError('Unable to access microphone. Please check your browser settings.');
          }
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          setError('No microphone detected. Please connect a microphone and try again.');
          setIsListening(false);
        } else if (event.error === 'network') {
          setError('Network error occurred. Please check your internet connection.');
          setIsListening(false);
        } else {
          setError(`Speech recognition error: ${event.error}. Please try again.`);
          setIsListening(false);
        }
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        setError(null);
        setRetryCount(0);
      };

      recognition.onend = () => {
        if (isListening && retryCount < MAX_RETRIES) {
          recognition.start();
        } else {
          setIsListening(false);
          setRetryCount(0);
        }
      };

      recognition.onaudiostart = () => {
        setError(null);
        setRetryCount(0);
      };

      return recognition;
    };

    setRecognition(createRecognition());
    const ctx = initializeAudioContext();

    const detectDevices = async (retryCount = 0) => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        if (audioInputs.length === 0) {
          if (retryCount < 3) {
            setTimeout(() => detectDevices(retryCount + 1), 1000);
          } else {
            setError('No audio input devices found. Please connect a microphone.');
          }
          return;
        }
        
        setAvailableDevices(audioInputs);

        // Try devices in priority order: Bluetooth > Default > Others
        const bluetoothDevice = audioInputs.find(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('wireless')
        );
        const defaultDevice = audioInputs.find(device => 
          device.deviceId === 'default' || 
          device.label.toLowerCase().includes('default')
        );

        // Try bluetooth first, then default, then others
        const devicesToTry = [
          bluetoothDevice,
          defaultDevice,
          ...audioInputs.filter(d => d !== bluetoothDevice && d !== defaultDevice)
        ].filter(Boolean);

        let deviceFound = false;
        for (const device of devicesToTry) {
          if (await verifyAndSelectDevice(device, ctx)) {
            deviceFound = true;
            break;
          }
        }

        if (!deviceFound) {
          setError('No working microphone found. Please check your microphone connection and settings.');
        }
      } catch (error) {
        setError('Unable to detect audio devices. Please check your microphone connection.');
      }
    };

    detectDevices();

    const handleDeviceChange = () => {
      detectDevices();
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
        stream.getTracks().forEach(track => track.stop());
        setError(null);
        return true;
      }
      
      stream.getTracks().forEach(track => track.stop());
      return false;
    } catch (err) {
      return false;
    }
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
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const peak = Math.max(...dataArray);
          
          if (average > 5 || peak > 20) {
            detected = true;
            clearInterval(intervalId);
            clearTimeout(detectionTimer);
            resolve(true);
          }
        };

        const intervalId = setInterval(checkLevel, 50);
        
        detectionTimer = setTimeout(() => {
          clearInterval(intervalId);
          resolve(detected);
        }, timeout);
      } catch (err) {
        resolve(false);
      }
    });
  };

  const startListening = async () => {
    if (!recognition) {
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
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        let deviceFound = false;
        for (const device of audioInputs) {
          if (await verifyAndSelectDevice(device, ctx)) {
            deviceFound = true;
            break;
          }
        }
        
        if (!deviceFound) {
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

      const timeout = selectedDevice?.label.toLowerCase().includes('bluetooth') ? 5000 : 3000;
      const hasAudio = await testAudioInput(stream, ctx, timeout);
      
      if (!hasAudio) {
        throw new Error('No audio input detected. Please check:\n1. Your microphone is not muted\n2. You are speaking into the microphone\n3. The correct audio device is selected');
      }

      setAudioStream(stream);
      setRetryCount(0);
      recognition.start();
      setIsListening(true);
      setTranscript('');
      setError(null);

    } catch (error) {
      if (error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError') {
        setError('Microphone is already in use by another application. Please close other apps using the microphone.');
      } else {
        setError(error.message || 'Failed to start speech recognition. Please try again.');
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
      
      if (await verifyAndSelectDevice(device, ctx)) {
        setError(null);
      } else {
        setError('Selected device is not working. Please try another device or check your microphone settings.');
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