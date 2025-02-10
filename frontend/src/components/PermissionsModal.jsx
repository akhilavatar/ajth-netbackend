import React, { useState } from 'react';
import { usePermissionsStore } from '../store/permissions';

const PermissionsModal = ({ onClose }) => {
  const { setPermission } = usePermissionsStore();
  const [permissionStates, setPermissionStates] = useState({
    location: 'pending',
    camera: 'pending',
    microphone: 'pending',
    motionSensors: 'pending',
    notifications: 'pending'
  });

  const updatePermissionState = (permission, state) => {
    setPermissionStates(prev => ({
      ...prev,
      [permission]: state
    }));
  };

  const checkDeviceAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      const hasMicrophone = devices.some(device => device.kind === 'audioinput');
      
      if (!hasCamera) {
        updatePermissionState('camera', 'unavailable');
        setPermission('camera', false);
      }
      
      if (!hasMicrophone) {
        updatePermissionState('microphone', 'unavailable');
        setPermission('microphone', false);
      }
    } catch (error) {
      console.error('Error checking device availability:', error);
    }
  };

  React.useEffect(() => {
    checkDeviceAvailability();
  }, []);

  const requestPermission = async (permission) => {
    try {
      updatePermissionState(permission, 'requesting');

      switch (permission) {
        case 'location':
          const locationResult = await navigator.permissions.query({ name: 'geolocation' });
          if (locationResult.state === 'granted') {
            setPermission('location', true);
            updatePermissionState('location', 'granted');
          } else {
            updatePermissionState('location', 'denied');
          }
          break;

        case 'camera':
          if (permissionStates.camera === 'unavailable') {
            throw new Error('No camera detected on this device');
          }
          await navigator.mediaDevices.getUserMedia({ video: true });
          setPermission('camera', true);
          updatePermissionState('camera', 'granted');
          break;

        case 'microphone':
          if (permissionStates.microphone === 'unavailable') {
            throw new Error('No microphone detected on this device');
          }
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setPermission('microphone', true);
          updatePermissionState('microphone', 'granted');
          break;

        case 'motionSensors':
          if ('DeviceMotionEvent' in window) {
            setPermission('motionSensors', true);
            updatePermissionState('motionSensors', 'granted');
          } else {
            updatePermissionState('motionSensors', 'unavailable');
          }
          break;

        case 'notifications':
          const notificationResult = await Notification.requestPermission();
          if (notificationResult === 'granted') {
            setPermission('notifications', true);
            updatePermissionState('notifications', 'granted');
          } else {
            updatePermissionState('notifications', 'denied');
          }
          break;
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
      updatePermissionState(permission, 'error');
      setPermission(permission, false);
    }
  };

  const getButtonStyle = (permission) => {
    switch (permissionStates[permission]) {
      case 'granted':
        return 'bg-green-500 hover:bg-green-600';
      case 'denied':
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'unavailable':
        return 'bg-gray-400 cursor-not-allowed';
      case 'requesting':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getButtonText = (permission) => {
    switch (permissionStates[permission]) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'error':
        return 'Error';
      case 'unavailable':
        return 'Unavailable';
      case 'requesting':
        return 'Requesting...';
      default:
        return 'Allow';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Permission Requests</h2>
        <p className="mb-6">To provide the best experience, we need your permission for the following:</p>
        
        <div className="space-y-4">
          {Object.entries({
            location: 'Location',
            camera: 'Camera',
            microphone: 'Microphone',
            motionSensors: 'Motion Sensors',
            notifications: 'Notifications'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span>{label}</span>
              <button 
                onClick={() => requestPermission(key)}
                disabled={['granted', 'unavailable'].includes(permissionStates[key])}
                className={`px-4 py-2 rounded text-white transition-colors ${getButtonStyle(key)}`}
              >
                {getButtonText(key)}
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PermissionsModal;