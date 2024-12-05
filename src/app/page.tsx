"use client";

import { useGeolocation } from "@/providers/overlay-provider";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { Geolocation, Temperature, Weather, place, currentTime } = useGeolocation();

  return (
    <main className="h-screen relative">
      <div className="absolute bottom-0 w-full h-12 px-2 bg-black opacity-80 grid grid-cols-6 text-white ">
        <StatComponent name="Place" value={place ? place : " Unknown"} />
        <StatComponent name="Temperature" value={Temperature ? Temperature + "°C" : "Unknown"} />
        <StatComponent name="Weather" value={Weather ? Weather : "Unknown"} />
        <StatComponent name="Traveled" value={Geolocation.totalDistance.toFixed(1) + " km"} />
        <StatComponent name="Speed" value={Geolocation.speed ? Geolocation.speed.toString() : "0" + " km/h"} />
        <StatComponent name="Current Time" value={currentTime ? currentTime : "Unknown"} />
      </div>
    </main>
  );
}

interface Statsprop {
  name: string;
  value: string;
}

interface Statsprop {
  name: string;
  value: string;
}

const StatComponent: React.FC<Statsprop> = ({ name, value }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        setIsOverflowing(containerRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
    };
  }, [value]);

  return (
    <div className="flex items-center space-x-2 text-lg overflow-hidden">
      {/* Static Label */}
      <h4 className=" whitespace-nowrap">{name}:</h4>

      {/* Animated Scrolling Text */}
      <div ref={containerRef} className="relative flex-grow overflow-hidden whitespace-nowrap">
        {isOverflowing ? (
          <motion.div
            className="inline-block"
            animate={{ x: ["100%", "-100%"] }}
            transition={{
              repeat: Infinity,
              duration: 10, // Adjust duration for speed
              ease: "linear",
            }}
          >
            {value}
          </motion.div>
        ) : (
          <span>{value}</span>
        )}
      </div>
    </div>
  );
};
