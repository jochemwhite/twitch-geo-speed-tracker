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
  distance: number; // Distance walked in km
  error: string | null;
}

const interpretAccuracy = (accuracy: number): string => {
  if (accuracy <= 5) return 'Excellent (likely outdoors with clear sky view)';
  if (accuracy <= 20) return 'Good (likely outdoors)';
  if (accuracy <= 100) return 'Moderate (might be indoors or in an urban area)';
  return 'Poor (likely indoors or obstructed)';
};

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const GeolocationSpeed: React.FC = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    speed: null,
    distance: 0, // Initialize distance
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prevState => ({ ...prevState, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    let watchId: number;
    let previousLocation: Location | null = null;

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

      // Calculate distance if we have a previous location
      let newDistance = state.distance;
      if (previousLocation) {
        const distance = haversineDistance(
          previousLocation.latitude,
          previousLocation.longitude,
          newLocation.latitude,
          newLocation.longitude
        );
        newDistance += distance;
      }
      previousLocation = newLocation; // Update previous location

      setState(prevState => ({
        ...prevState,
        location: newLocation,
        speed: newSpeed,
        distance: newDistance, // Update total distance
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
  }, [state.distance]); // Include distance as dependency

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
          <p>Distance Walked: {state.distance.toFixed(2)} km</p> {/* Display total distance */}
        </div>
      ) : (
        <p>Loading location data...</p>
      )}
    </div>
  );
};

export default GeolocationSpeed;
