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

type Speed = number | null;

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface GeolocationState {
  location: Location | null;
  speed: Speed;
  distance: number;
  totalDistance: number;
  error: string | null;
  isLoading: boolean;
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
    totalDistance: 0,
    error: null,
    isLoading: true,
  });

  const previousLocationRef = useRef<Location | null>(null);
  const weatherIntervalRef = useRef<NodeJS.Timeout>();

  // Memoized weather fetching function
  const fetchWeatherData = useCallback(async (latitude: number, longitude: number) => {
    console.log(`Fetching weather data from ${latitude}, ${longitude}`);

    try {
      const weatherData = await getWeatherData(latitude, longitude);
      if (weatherData) {
        setTemperature(weatherData.temperature);
        setWeather(weatherData.weather);
        setPlace(weatherData.place);
      }
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
    }
  }, []);

  // Handle location updates
  const handleLocationUpdate = useCallback(
    (position: GeolocationPosition) => {
      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      console.debug("New location update:", {
        coords: newLocation,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
      });

      const newSpeed: Speed = position.coords.speed !== null ? parseFloat((position.coords.speed * 3.6).toFixed(2)) : 0;

      // Calculate distance if we have a previous location
      let newDistance = 0;
      if (previousLocationRef.current) {
        const distance = haversineDistance(
          previousLocationRef.current.latitude,
          previousLocationRef.current.longitude,
          newLocation.latitude,
          newLocation.longitude
        );

        // Only update if movement is more than 5 meters and accuracy is good
        if (distance > 0.005 && position.coords.accuracy < 20) {
          newDistance = distance;
          previousLocationRef.current = newLocation;

          setGeolocation((prev) => ({
            ...prev,
            location: newLocation,
            speed: newSpeed,
            distance: newDistance,
            totalDistance: prev.totalDistance + newDistance,
            isLoading: false,
          }));
        }
      } else {
        // First location update
        previousLocationRef.current = newLocation;
        setGeolocation((prev) => ({
          ...prev,
          location: newLocation,
          speed: newSpeed,
          isLoading: false,
        }));
      }

      // Fetch weather data when location updates
      fetchWeatherData(newLocation.latitude, newLocation.longitude);
    },
    [fetchWeatherData]
  );

  // Set up geolocation watching
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocation((prev) => ({
        ...prev,
        error: "Geolocation is not supported",
        isLoading: false,
      }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    const watchId = navigator.geolocation.watchPosition(
      handleLocationUpdate,
      (error) =>
        setGeolocation((prev) => ({
          ...prev,
          error: `ERROR(${error.code}): ${error.message}`,
          isLoading: false,
        })),
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleLocationUpdate]);

  // Set up weather update interval
  useEffect(() => {
    if (Geolocation.location) {
      // Clear any existing interval
      if (weatherIntervalRef.current) {
        clearInterval(weatherIntervalRef.current);
      }

      // Set up new interval to fetch weather data every 15 minutes
      weatherIntervalRef.current = setInterval(() => {
        fetchWeatherData(Geolocation.location!.latitude, Geolocation.location!.longitude);
      }, 15 * 60 * 1000); // 15 minutes in milliseconds

      // Clean up interval on unmount
      return () => {
        if (weatherIntervalRef.current) {
          clearInterval(weatherIntervalRef.current);
        }
      };
    }
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

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate inputs
  if (!isFinite(lat1) || !isFinite(lon1) || !isFinite(lat2) || !isFinite(lon2)) {
    console.error("Invalid coordinates provided to haversineDistance");
    return 0;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Returns distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
