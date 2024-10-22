"use client";
import { getWeatherData } from "@/actions";
import { useEffect, createContext, useState, useContext, useRef, useCallback } from "react";

interface OverlayProviderProps {
  children: React.ReactNode;
}

interface OverlayContext {
  place: string | undefined;
  Temperature: number | undefined;
  Weather: string | undefined;
  Geolocation: GeolocationState;
}

type Speed = number | "Speed not available" | null;

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationState {
  location: Location | null;
  speed: Speed;
  distance: number;
  error: string | null;
}

export const OverlayContext = createContext<OverlayContext | null>(null);

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [place, setPlace] = useState<string>();
  const [Temperature, setTemperature] = useState<number>();
  const [Weather, setWeather] = useState<string>();
  const [Geolocation, setGeolocation] = useState<GeolocationState>({
    location: null,
    speed: null,
    distance: 0,
    error: null,
  });

  const previousLocationRef = useRef<Location | null>(null);
  const weatherIntervalRef = useRef<NodeJS.Timeout>();

  // Memoized weather fetching function
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    try {
      const weatherData = await getWeatherData(latitude, longitude);
      if (weatherData) {
        setTemperature(weatherData.temperature);
        setWeather(weatherData.weather);
        setPlace(weatherData.place);
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }, []);

  // Handle location updates
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const newLocation: Location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    const newSpeed: Speed = position.coords.speed !== null
      ? parseFloat((position.coords.speed * 3.6).toFixed(2))
      : "Speed not available";

    // Calculate distance if we have a previous location
    let newDistance = Geolocation.distance;
    if (previousLocationRef.current) {
      const distance = haversineDistance(
        previousLocationRef.current.latitude,
        previousLocationRef.current.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      newDistance += distance;
    }
    previousLocationRef.current = newLocation;

    setGeolocation(prev => ({
      ...prev,
      location: newLocation,
      speed: newSpeed,
      distance: newDistance,
    }));

    // Fetch weather data immediately when location updates
    fetchWeatherData(newLocation.latitude, newLocation.longitude);
  }, [Geolocation.distance, fetchWeatherData]);

  // Set up geolocation watching
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocation(prev => ({ ...prev, error: "Geolocation is not supported" }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      error => setGeolocation(prev => ({ ...prev, error: `ERROR(${error.code}): ${error.message}` })),
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleLocationUpdate]);

  // Set up weather update interval
  useEffect(() => {
    // Clear any existing interval
    if (weatherIntervalRef.current) {
      clearInterval(weatherIntervalRef.current);
    }

    // Only start interval if we have a location
    if (Geolocation.location) {
      weatherIntervalRef.current = setInterval(() => {
        fetchWeatherData(
          Geolocation.location!.latitude,
          Geolocation.location!.longitude
        );
      }, 10 * 60 * 1000); // 10 minutes
    }

    return () => {
      if (weatherIntervalRef.current) {
        clearInterval(weatherIntervalRef.current);
      }
    };
  }, [Geolocation.location, fetchWeatherData]);

  return (
    <OverlayContext.Provider
      value={{
        place,
        Temperature,
        Weather,
        Geolocation,
      }}
    >

      {children}
    </OverlayContext.Provider>
  );
};

export function useGeolocation(): OverlayContext {
  const context = useContext(OverlayContext);
  if (context === null) {
    throw new Error("useGeolocation must be used within a GeolocationProvider");
  }
  return context;
}

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};