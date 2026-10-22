const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

async function getCurrentWeather() {
  const url = new URL(WEATHER_API_URL);

  url.search = new URLSearchParams({
    latitude: "12.9716",
    longitude: "77.5946",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
    ].join(","),
    timezone: "Asia/Kolkata",
  }).toString();

  // Request current weather from Open-Meteo.
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const details = await response.text();

    throw new Error(`Weather API returned HTTP ${response.status}: ${details}`);
  }

  const data = await response.json();

  if (!data.current || !data.current_units) {
    throw new Error("Weather API returned an unexpected response.");
  }

  // Return only the information our frontend needs.
  return {
    location: "Bengaluru",
    timezone: data.timezone,
    time: data.current.time,

    temperature: data.current.temperature_2m,
    temperatureUnit: data.current_units.temperature_2m,

    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    humidityUnit: data.current_units.relative_humidity_2m,

    precipitation: data.current.precipitation,
    precipitationUnit: data.current_units.precipitation,

    windSpeed: data.current.wind_speed_10m,
    windSpeedUnit: data.current_units.wind_speed_10m,

    weatherCode: data.current.weather_code,
  };
}

module.exports = { getCurrentWeather };
