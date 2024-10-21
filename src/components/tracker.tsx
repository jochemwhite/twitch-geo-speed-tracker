import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';

interface Position {
  latitude: number;
  longitude: number;
}

interface TrackingData {
  speed: number;
  position: Position;
}

const WalkingSpeedTracker: React.FC = () => {
  const [trackingData, setTrackingData] = useState<TrackingData>({
    speed: 0,
    position: { latitude: 0, longitude: 0 },
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        setTrackingData({
          speed: speed !== null ? speed : 0,
          position: { latitude, longitude },
        });

      },
      (err) => {
        setError(`Geolocation error: ${err.message}`);
        console.error('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);



  return (
    <div>
      <h2>Walking Speed and Location Tracker</h2>
      <p>Current walking speed: {trackingData.speed.toFixed(2)} m/s</p>
      <p>
        Current location: Latitude {trackingData.position.latitude.toFixed(6)}, 
        Longitude {trackingData.position.longitude.toFixed(6)}
      </p>
    </div>
  );
};

export default WalkingSpeedTracker;