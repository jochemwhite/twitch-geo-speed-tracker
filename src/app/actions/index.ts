"use server";
import axios from "axios";
import { env } from "@/lib/env";
interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level: number;
    grnd_level: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust: number;
  };
  rain: {
    "1h": number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export async function getWeatherData(lat: number, lon: number) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHERMAP_API_KEY}&units=metric`;
  try {
    const response = await axios.get<WeatherData>(url);
    const data = response.data;

    return {
      place: data.name,
      temperature: data.main.temp,
      weather: data.weather[0].description,
      weatherIcon: `http://openweathermap.org/img/w/${data.weather[0].icon}.png`,
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}
