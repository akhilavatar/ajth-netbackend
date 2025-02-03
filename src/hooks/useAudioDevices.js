import { useState, useEffect, useRef } from 'react';

export const useAudioDevices = () => {
  const [audioInputs, setAudioInputs] = useState([]);
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedInput, setSelectedInput] = useState(null);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const inputs = devices.filter(device => device.kind === 'audioinput');
      const outputs = devices.filter(device => device.kind === 'audiooutput');
      
      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      // Set default devices
      const defaultInput = inputs.find(device => device.deviceId === 'default');
      const defaultOutput = outputs.find(device => device.deviceId === 'default');
      
      if (defaultInput && !selectedInput) setSelectedInput(defaultInput);
      if (defaultOutput && !selectedOutput) setSelectedOutput(defaultOutput);
      
      setError(null);
    } catch (err) {
      setError('Failed to enumerate audio devices: ' + err.message);
    }
  };

  const startAudioMonitoring = async (deviceId) => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Create new AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: deviceId ? { exact: deviceId } : undefined }
      });
      streamRef.current = stream;

      // Create analyser node
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsListening(true);
      monitorAudioLevel();
    } catch (err) {
      setError(`Failed to start audio monitoring: ${err.message}`);
      setIsListening(false);
    }
  };

  const stopAudioMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setAudioLevel(0);
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current || !isListening) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      const normalizedLevel = average / 255; // Normalize to 0-1 range
      setAudioLevel(normalizedLevel);

      requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  const selectDevice = async (deviceId, type) => {
    try {
      if (type === 'input') {
        await startAudioMonitoring(deviceId);
        const device = audioInputs.find(d => d.deviceId === deviceId);
        setSelectedInput(device);
      } else {
        const device = audioOutputs.find(d => d.deviceId === deviceId);
        setSelectedOutput(device);
      }
      setError(null);
    } catch (err) {
      setError(`Failed to select ${type} device: ${err.message}`);
    }
  };

  // Listen for device changes
  useEffect(() => {
    enumerateDevices();

    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      stopAudioMonitoring();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    audioInputs,
    audioOutputs,
    selectedInput,
    selectedOutput,
    selectDevice,
    error,
    audioLevel,
    isListening,
    startAudioMonitoring,
    stopAudioMonitoring
  };
};