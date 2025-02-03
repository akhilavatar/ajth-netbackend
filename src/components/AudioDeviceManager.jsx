import React, { useEffect, useState } from 'react';
import { useAudioDevices } from '../hooks/useAudioDevices';

export const AudioDeviceManager = () => {
  const {
    audioInputs,
    audioOutputs,
    selectedInput,
    selectedOutput,
    selectDevice,
    error,
    audioLevel,
    isListening
  } = useAudioDevices();

  const [audioLog, setAudioLog] = useState([]);

  useEffect(() => {
    if (audioLevel > 0.1) { // Threshold for logging
      const timestamp = new Date().toLocaleTimeString();
      setAudioLog(prev => [...prev, {
        time: timestamp,
        level: audioLevel
      }].slice(-10)); // Keep last 10 entries
    }
  }, [audioLevel]);

  const getDeviceStatus = (device) => {
    if (device.deviceId === 'default') return '(System Default)';
    if (device.deviceId === selectedInput?.deviceId || device.deviceId === selectedOutput?.deviceId) {
      return '(Active)';
    }
    return '';
  };

  const troubleshoot = () => {
    const steps = [
      "1. Check if your devices are properly connected",
      "2. Ensure devices are not muted in system settings",
      "3. Try unplugging and reconnecting your devices",
      "4. Check if correct permissions are granted in browser settings",
      "5. Restart your browser if issues persist"
    ];
    return steps;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Audio Device Manager</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
          <div className="mt-4">
            <h4 className="font-bold">Troubleshooting Steps:</h4>
            <ul className="list-disc pl-5">
              {troubleshoot().map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Audio Level Indicator */}
      {isListening && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Microphone Level</h3>
          <div className="w-full h-4 bg-gray-200 rounded overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: `${audioLevel * 100}%` }}
            />
          </div>
          
          {/* Audio Log */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Audio Activity Log</h4>
            <div className="max-h-40 overflow-y-auto bg-gray-50 rounded p-2">
              {audioLog.map((entry, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {entry.time}: Audio peak detected (Level: {Math.round(entry.level * 100)}%)
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Input Devices (Microphones)</h3>
        {audioInputs.length === 0 ? (
          <p className="text-gray-500">No input devices detected</p>
        ) : (
          <div className="space-y-2">
            {audioInputs.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div>
                  <span className="font-medium">{device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}</span>
                  <span className="ml-2 text-sm text-gray-500">{getDeviceStatus(device)}</span>
                </div>
                <button
                  onClick={() => selectDevice(device.deviceId, 'input')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={device.deviceId === selectedInput?.deviceId}
                >
                  {device.deviceId === selectedInput?.deviceId ? 'Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Output Devices (Speakers/Headphones)</h3>
        {audioOutputs.length === 0 ? (
          <p className="text-gray-500">No output devices detected</p>
        ) : (
          <div className="space-y-2">
            {audioOutputs.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
              >
                <div>
                  <span className="font-medium">{device.label || `Speaker ${device.deviceId.slice(0, 8)}...`}</span>
                  <span className="ml-2 text-sm text-gray-500">{getDeviceStatus(device)}</span>
                </div>
                <button
                  onClick={() => selectDevice(device.deviceId, 'output')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={device.deviceId === selectedOutput?.deviceId}
                >
                  {device.deviceId === selectedOutput?.deviceId ? 'Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};