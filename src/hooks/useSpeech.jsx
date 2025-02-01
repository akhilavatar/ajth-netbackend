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
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
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
            if (isListening) {
              setTimeout(() => recognitionRef.current?.start(), 100);
            }
          } else {
            setError('No speech detected. Please check your microphone.');
            setIsListening(false);
            setRetryCount(0);
          }
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
          setIsListening(false);
        } else if (event.error === 'audio-capture') {
          setError('No microphone detected. Please connect a microphone.');
          setIsListening(false);
        } else {
          setError(`Speech recognition error: ${event.error}.`);
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
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 500);
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
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const detectDevices = async (ctx) => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      if (audioInputs.length === 0) {
        setError('No audio input devices found. Please connect a microphone.');
        return;
      }

      setAvailableDevices(audioInputs);
      const sortedDevices = audioInputs.sort((a, b) => (a.deviceId === 'default' ? -1 : 1));

      for (const device of sortedDevices) {
        if (await verifyAndSelectDevice(device, ctx)) {
          return;
        }
      }

      setError('No working microphone found.');
    } catch (error) {
      console.error('Error detecting devices:', error);
      setError('Unable to detect audio devices.');
    }
  };

  const verifyAndSelectDevice = async (device, context) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
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
    } catch {
      return false;
    }
  };

  const testAudioInput = async (stream, context, timeout = 1000) => {
    return new Promise((resolve) => {
      try {
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let detected = false;
        let silenceCounter = 0;
        const intervalId = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          if (avg > 1) {
            detected = true;
            clearInterval(intervalId);
            resolve(true);
          } else if (++silenceCounter >= 10) {
            clearInterval(intervalId);
            resolve(true);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(intervalId);
          resolve(detected);
        }, timeout);
      } catch {
        resolve(true);
      }
    });
  };

  const startListening = async () => {
    if (isListening || !recognitionRef.current) return;
    try {
      if (audioStream) audioStream.getTracks().forEach(track => track.stop());
      initializeAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      setAudioStream(stream);
      setRetryCount(0);
      setIsListening(true);
      setTranscript('');
      setError(null);
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start speech recognition.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;
    recognitionRef.current.stop();
    if (audioStream) audioStream.getTracks().forEach(track => track.stop());
    setIsListening(false);
    setAudioStream(null);
    setRetryCount(0);
  };

  const selectDevice = async (deviceId) => {
    const device = availableDevices.find(d => d.deviceId === deviceId);
    if (device) {
      if (isListening) stopListening();
      initializeAudioContext();
      await verifyAndSelectDevice(device, audioContextRef.current);
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
