'use client'
import React, { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

type Speed = number | 'Speed not available' | null;

interface GeolocationState {
  location: Location | null;
  speed: Speed;
  error: string | null;
}

const interpretAccuracy = (accuracy: number): string => {
  if (accuracy <= 5) return 'Excellent (likely outdoors with clear sky view)';
  if (accuracy <= 20) return 'Good (likely outdoors)';
  if (accuracy <= 100) return 'Moderate (might be indoors or in an urban area)';
  return 'Poor (likely indoors or obstructed)';
};

const GeolocationSpeed: React.FC = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    speed: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({ ...prevState, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    let watchId: number;

    const successCallback = (position: GeolocationPosition) => {
      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      let newSpeed: Speed = null;
      if (position.coords.speed !== null) {
        const speedKmh = position.coords.speed * 3.6;
        newSpeed = parseFloat(speedKmh.toFixed(2));
      } else {
        newSpeed = 'Speed not available';
      }

      setState(prevState => ({
        ...prevState,
        location: newLocation,
        speed: newSpeed,
      }));
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setState(prevState => ({ ...prevState, error: `ERROR(${error.code}): ${error.message}` }));
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div>
      <h2>Geolocation and Speed</h2>
      {state.error ? (
        <p>Error: {state.error}</p>
      ) : state.location ? (
        <div>
          <p>Latitude: {state.location.latitude}</p>
          <p>Longitude: {state.location.longitude}</p>
          <p>Accuracy: {state.location.accuracy.toFixed(2)} meters</p>
          <p>Accuracy Interpretation: {interpretAccuracy(state.location.accuracy)}</p>
          <p>Speed: {state.speed !== null ? `${state.speed} km/h` : 'Calculating...'}</p>
        </div>
      ) : (
        <p>Loading location data...</p>
      )}
    </div>
  );
};

export default GeolocationSpeed;