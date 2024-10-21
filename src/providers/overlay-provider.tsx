"use client";
import { getWeatherData } from "@/app/actions";
import { useEffect, createContext, useState, useContext } from "react";

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

export const OverlayContext = createContext<OverlayContext | null>(null);

interface GeolocationState {
  location: Location | null;
  speed: Speed;
  distance: number; // Distance walked in km
  error: string | null;
}

export const OverlayProvider: React.FC<OverlayProviderProps> = ({ children }) => {
  const [place, setPlace] = useState<string>();
  const [Temperature, setTemperature] = useState<number>();
  const [Weather, setWeather] = useState<string>();
  const [Geolocation, setGeolocation] = useState<GeolocationState>({
    location: null,
    speed: null,
    distance: 0, // Initialize distance
    error: null,
  });
  const [hasInterval, setHasInterval] = useState(false);

  // create a interval to update the weather every 10 minutes

  // Haversine distance
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocation((prevState) => ({ ...prevState, error: "Geolocation is not supported by your browser" }));
      return;
    }

    let watchId: number;
    let previousLocation: Location | null = null;

    const successCallback = async (position: GeolocationPosition) => {
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
        newSpeed = "Speed not available";
      }

      // Calculate distance if we have a previous location
      let newDistance = Geolocation.distance;
      if (previousLocation) {
        const distance = haversineDistance(previousLocation.latitude, previousLocation.longitude, newLocation.latitude, newLocation.longitude);
        newDistance += distance;
      }
      previousLocation = newLocation; // Update previous location

      setGeolocation((prevState) => ({
        ...prevState,
        location: newLocation,
        speed: newSpeed,
        distance: newDistance, // Update total distance
      }));

      // check if we have an interval
      if (hasInterval) {
        console.log("interval is running");

        return;
      }

      // create a new interval to update the weather every 10 minutes
      const intervalId = setInterval(async () => {
        console.log("interval is running");
        setHasInterval(true);
        if (!Geolocation.location) {
          console.log("location is null");

          clearInterval(intervalId);
          setHasInterval(false);
          return;
        }

        const weatherData = await getWeatherData(Geolocation.location.latitude, Geolocation.location.latitude);

        if (!weatherData) {
          console.log("weather data is null");
          return;
        }

        console.log(weatherData);
      }, 10 * 60 * 1000); // 10 minutes

      console.log("interval is not running");
    };

    const errorCallback = (error: GeolocationPositionError) => {
      setGeolocation((prevState) => ({ ...prevState, error: `ERROR(${error.code}): ${error.message}` }));
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setHasInterval(false);
    };
  }, [Geolocation.distance]); // Include distance as dependency

  // Weather

  return (
    <OverlayContext.Provider
      value={{
        place,
        Temperature,
        Weather,
        Geolocation,
      }}
    >
      <p>
        Place: {Geolocation.location?.latitude}, {Geolocation.location?.longitude}
      </p>
      {children}
    </OverlayContext.Provider>
  );
};

// create custom hook
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
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};
