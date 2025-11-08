"use strict";

const weatherCodeMap = {
  0: { desc: "Clear", icon: "assets/images/icon-sunny.webp" },
  1: { desc: "Mainly clear", icon: "assets/images/icon-sunny.webp" },
  2: { desc: "Partly cloudy", icon: "assets/images/icon-partly-cloudy.webp" },
  3: { desc: "Overcast", icon: "assets/images/icon-overcast.webp" },
  45: { desc: "Fog", icon: "assets/images/icon-fog.webp" },
  48: { desc: "Depositing rime fog", icon: "assets/images/icon-fog.webp" },
  51: { desc: "Light drizzle", icon: "assets/images/icon-drizzle.webp" },
  53: { desc: "Moderate drizzle", icon: "assets/images/icon-drizzle.webp" },
  55: { desc: "Dense drizzle", icon: "assets/images/icon-drizzle.webp" },
  56: {
    desc: "Light freezing drizzle",
    icon: "assets/images/icon-drizzle.webp",
  },
  57: {
    desc: "Dense freezing drizzle",
    icon: "assets/images/icon-drizzle.webp",
  },
  61: { desc: "Slight rain", icon: "assets/images/icon-rain.webp" },
  63: { desc: "Moderate rain", icon: "assets/images/icon-rain.webp" },
  65: { desc: "Heavy rain", icon: "assets/images/icon-rain.webp" },
  66: { desc: "Light freezing rain", icon: "assets/images/icon-rain.webp" },
  67: { desc: "Heavy freezing rain", icon: "assets/images/icon-rain.webp" },
  71: { desc: "Slight snow fall", icon: "assets/images/icon-snow.webp" },
  73: { desc: "Moderate snow fall", icon: "assets/images/icon-snow.webp" },
  75: { desc: "Heavy snow fall", icon: "assets/images/icon-snow.webp" },
  77: { desc: "Snow grains", icon: "assets/images/icon-snow.webp" },
  80: { desc: "Slight rain showers", icon: "assets/images/icon-rain.webp" },
  81: { desc: "Moderate rain showers", icon: "assets/images/icon-rain.webp" },
  82: { desc: "Violent rain showers", icon: "assets/images/icon-rain.webp" },
  85: { desc: "Slight snow showers", icon: "assets/images/icon-snow.webp" },
  86: { desc: "Heavy snow showers", icon: "assets/images/icon-snow.webp" },
  95: { desc: "Thunderstorm", icon: "assets/images/icon-storm.webp" },
  96: {
    desc: "Thunderstorm with slight hail",
    icon: "assets/images/icon-storm.webp",
  },
  99: {
    desc: "Thunderstorm with heavy hail",
    icon: "assets/images/icon-storm.webp",
  },
};

// Fetch city data from Nominatim API
async function getCityData(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    cityName
  )}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
      },
    });
    const data = await response.json();

    if (!data.length) {
      throw new Error("Location not found");
    }

    const location = data[0];
    const address = location.address || {};

    // Extract country from display_name (last part after last comma)
    const displayNameParts = location.display_name.split(",");
    const country = displayNameParts[displayNameParts.length - 1].trim();

    // Return city name (or fallback), country, and coordinates
    return {
      city: address.city || address.town || address.village || cityName,
      country: address.country || country,
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
    };
  } catch (error) {
    console.error("Error fetching city data:", error);
    throw error;
  }
}

//get curerent date
function formatFullDate(date = new Date()) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

// Fetch weather data from Open-Meteo API
async function fetchWeather(lat, lon) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weathercode,apparent_temperature,precipitation,relativehumidity_2m,windspeed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum` + // <--- add precipitation_sum here
    `&current_weather=true&timezone=auto`;

  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `Weather API request failed: ${response.status} ${response.statusText}`
      );

    const data = await response.json();

    const current = data.current_weather;

    // Current condition text
    const currentCondition = weatherCodeMap[current.weathercode] || "Unknown";

    // Daily forecast arrays
    const dailyForecast = data.daily.time.map((date, i) => ({
      date,
      highC: data.daily.temperature_2m_max[i],
      lowC: data.daily.temperature_2m_min[i],
      condition: weatherCodeMap[data.daily.weathercode[i]] || "Unknown",
    }));

    // Hourly forecast: Take next 24 hours from now
    const nowIndex = data.hourly.time.findIndex(
      (t) => new Date(t) > new Date()
    );
    const hourlyForecast = data.hourly.time
      .slice(nowIndex, nowIndex + 24)
      .map((time, i) => ({
        time,
        temperatureC: data.hourly.temperature_2m[nowIndex + i],
        condition:
          weatherCodeMap[data.hourly.weathercode[nowIndex + i]] || "Unknown",
        feelsLikeC: data.hourly.apparent_temperature[nowIndex + i],
        precipitation: data.hourly.precipitation[nowIndex + i],
        humidity: data.hourly.relativehumidity_2m[nowIndex + i],
        windSpeed: data.hourly.windspeed_10m[nowIndex + i],
      }));

    return {
      currentTemperatureCelsius: current.temperature,
      currentCondition,
      feelsLikeCelsius: hourlyForecast[0]?.feelsLikeC || null,
      humidity: hourlyForecast[0]?.humidity || null,
      windSpeed: hourlyForecast[0]?.windSpeed || null,
      precipitation: hourlyForecast[0]?.precipitation || 0,
      dailyForecast,
      hourlyForecast,
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw error;
  }
}

function groupHourlyByDay(hourlyData) {
  const grouped = {};

  hourlyData.time.forEach((timeStr, idx) => {
    //date time string adding
    const date = timeStr.split("T")[0];

    if (!grouped[date]) grouped[date] = [];

    const code = hourlyData.weathercode[idx];
    const weatherInfo = weatherCodeMap[code] || {
      desc: "Unknown",
      icon: "assets/images/icon-sunny.webp",
    };

    grouped[date].push({
      time: timeStr,
      temperatureC: hourlyData.temperature_2m[idx],
      weatherCode: code,
      weatherDesc: weatherInfo.desc,
      weatherIcon: weatherInfo.icon,
      apparentTemperature: hourlyData.apparent_temperature[idx],
      precipitation: hourlyData.precipitation[idx],
      humidity: hourlyData.relativehumidity_2m[idx],
      windSpeed: hourlyData.windspeed_10m[idx],
    });
  });

  return grouped;
}
/*
// Fetch hourly forecast for the next 7 days and group by day
 async function fetchHourly7Days(lat, lon) {
  const today = new Date();
  const startDate = today.toISOString().split("T")[0];
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().split("T")[0];

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&hourly=temperature_2m,weathercode` +
    `&timezone=auto&start_date=${startDate}&end_date=${endDateStr}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather API request failed");

  const data = await response.json();

  // Group hourly data by date
  const grouped = {};
  data.hourly.time.forEach((timeStr, index) => {
    const [date, time] = timeStr.split("T");
    const hour = parseInt(time.split(":")[0]);

    // Keep only hours between 15:00 and 22:00
    if (hour >= 15 && hour <= 22) {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        time: time.slice(0, 5), // e.g., "15:00"
        temperatureC: data.hourly.temperature_2m[index],
        icon:
          weatherCodeMap[data.hourly.weathercode[index]] ||
          "assets/images/icon-sunny.webp",
      });
    }
  });

  // Convert grouped object into an array of objects (7 days)
  const result = Object.entries(grouped).map(([date, hours]) => ({
    date,
    hours,
  }));

  // Sort by date (for safety)
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
} */

// Helper function to get next 7 day names
function getNext7DayNames() {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const today = new Date();
  const result = [];

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + i);
    result.push(days[nextDay.getDay()]);
  }

  return result;
}

//new function to fetch hourly data for next 7 days
async function fetchHourly7Days(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather API request failed");

  const data = await response.json();
  const grouped = {};

  data.hourly.time.forEach((timeStr, index) => {
    const [date, time] = timeStr.split("T");
    const hour = parseInt(time.split(":")[0]);

    // keep only hours between 15:00 and 22:00
    if (hour >= 15 && hour <= 22) {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push({
        time: time.slice(0, 5), // e.g. "15:00"
        temperatureC: Math.round(data.hourly.temperature_2m[index]),
        icon:
          weatherCodeMap[data.hourly.weathercode[index]]?.icon ||
          "assets/images/icon-sunny.webp",
      });
    }
  });

  // ✅ Convert grouped object into an array of objects
  const result = Object.entries(grouped).map(([date, hours]) => ({
    date,
    hours,
  }));

  // ✅ Sort by date (optional but clean)
  result.sort((a, b) => new Date(a.date) - new Date(b.date));

  return result;
}

//helper function to capitalize words
function capitalizeWords(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

//helper function to format full date
function getDayName(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

//helper function convert C to F
function convertCelsiuestoFahrenheit(dataField) {
  const temp = Math.round(
    (Number(dataField.textContent.slice(0, -1)) * 9) / 5 + 32
  );
  dataField.textContent = `${temp}F`;
}

//helper function convert F to C
function convertFahrenheirtoCelsius(dataField) {
  const temp = Math.round(
    ((Number(dataField.textContent.slice(0, -1)) - 32) * 5) / 9
  );
  dataField.textContent = `${temp}º`;
}

/*
// Example usage:
fetchHourly7Days(52.52, 13.41)
  .then((hourlyByDay) => console.log(hourlyByDay))s
  .catch(console.error);


// Usage example of getCityData:
getCityData("Rome")
  .then((result) =>
    fetchWeather(result.latitude, result.longitude)
      .then((data) => console.log(data))
      .catch(console.error)
  )
  .catch((err) => console.error(err));

// Usage example:
fetchWeather(52.52, 13.41) // Berlin coords
  .then((data) => console.log(data))
  .catch(console.error);

// Usage example of formatFullDate:
formatFullDate();
*/
