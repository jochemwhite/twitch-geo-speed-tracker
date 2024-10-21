"use client";
import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { usePosition } from "use-position";

interface Position {
  latitude: number;
  longitude: number;
}

type TrackingData = {
  speed: number;
  position: Position;
};

const WalkingSpeedTracker = () => {
  const [trackingData, setTrackingData] = useState<TrackingData>({
    speed: 0,
    position: { latitude: 0, longitude: 0 },
  });
  const { latitude, longitude, error } = usePosition(true, {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  });

  useEffect(() => {
    if (latitude && longitude) {
      setTrackingData((prevData) => ({
        ...prevData,
        position: { latitude, longitude },
      }));
      sendDataToServer();
    }
  }, [latitude, longitude]);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const speed = position.coords.speed || 0;
        setTrackingData((prevData) => ({
          ...prevData,
          speed,
        }));
        sendDataToServer();
      },
      (error) => console.error(error)
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const sendDataToServer = async () => {
    try {
      await axios.post<void>("/api/track-movement", trackingData);
      console.log("Data sent to server successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error sending data to server:", (error as AxiosError).message);
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };

  return (
    <div>
      <h2>Walking Speed and Location Tracker</h2>
      <p>Current walking speed: {trackingData.speed.toFixed(2)} m/s</p>
      <p>
        Current location: Latitude {trackingData.position.latitude.toFixed(6)}, Longitude {trackingData.position.longitude.toFixed(6)}
      </p>
    </div>
  );
};

export default WalkingSpeedTracker;
