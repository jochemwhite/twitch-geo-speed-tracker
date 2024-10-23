"use client";

import { useGeolocation } from "@/providers/overlay-provider";

export default function Home() {
  const { Geolocation, Temperature, Weather, place } = useGeolocation();

  return (
    <main className="flex h-screen flex-col justify-end items-end bg-transparent text-white">
      <div className="w-full h-8 bg-black opacity-80 flex items-center justify-between px-2">
        <StatComponent name="Place" value={place ? place : "Unknown"} />
        <StatComponent name="Temperature" value={Temperature ? Temperature + "°C" : "Unknown"} />
        <StatComponent name="Weather" value={Weather ? Weather : "Unknown"} />
        <StatComponent name="Traveled" value={Geolocation.totalDistance.toFixed(1) + " km"} />
        <StatComponent name="Speed" value={Geolocation.speed + " km/h"} />
      </div>
    </main>
  );
}

interface Statsprop {
  name: string;
  value: string;
}

function StatComponent({ name, value }: Statsprop) {
  return (
    <div className="flex">
      <h4>{name}: </h4>
      <p className="ml-2">{value}</p>
    </div>
  );
}
