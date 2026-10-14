
const GEOCODING_URL =
  "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast";

const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const searchButton = document.getElementById("search-button");
const statusMessage = document.getElementById("status");
const weatherPanel = document.getElementById("weather-panel");

const weatherSymbol = document.getElementById("weather-symbol");
const conditionElement = document.getElementById("condition");
const temperatureElement = document.getElementById("temperature");
const cityElement = document.getElementById("city-name");
const humidityElement = document.getElementById("humidity");
const windElement = document.getElementById("wind");
const feelsLikeElement = document.getElementById("feels-like");
const updatedElement = document.getElementById("updated");

const weatherDescriptions = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Light freezing drizzle", "🌧️"],
  57: ["Dense freezing drizzle", "🌧️"],
  61: ["Slight rain", "🌦️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Light freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Moderate snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "❄️"],
  80: ["Slight rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"],
  85: ["Slight snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with slight hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"]
};

function describeWeather(code) {
  return weatherDescriptions[code] ||
    ["Weather conditions unavailable", "🌍"];
}

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status}). Please try again.`
    );
  }

  return response.json();
}

async function checkWeather(city) {
  const query = city.trim();

  if (!query) {
    statusMessage.textContent = "Please enter a city name.";
    cityInput.focus();
    return;
  }

  searchButton.disabled = true;
  statusMessage.textContent =
    "Finding city and loading weather…";

  try {
    // Step 1: Find the city coordinates.
    const geocodingUrl = new URL(GEOCODING_URL);

    geocodingUrl.search = new URLSearchParams({
      name: query,
      count: "1",
      language: "en",
      format: "json"
    });

    const locations = await getJson(geocodingUrl);
    const place = locations.results?.[0];

    if (!place) {
      weatherPanel.hidden = true;
      statusMessage.textContent =
        `No city found for "${query}". Check the spelling and try again.`;
      return;
    }

    // Step 2: Request the current weather for that location.
    const weatherUrl = new URL(WEATHER_URL);

    weatherUrl.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current:
        "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
      timezone: "auto"
    });

    const result = await getJson(weatherUrl);
    const current = result.current;

    if (!current) {
      throw new Error(
        "The weather service did not return current conditions."
      );
    }

    // Step 3: Display the returned weather data.
    const [description, icon] =
      describeWeather(current.weather_code);

    weatherSymbol.textContent = icon;
    conditionElement.textContent = description;

    temperatureElement.textContent =
      `${Math.round(current.temperature_2m)}°C`;

    cityElement.textContent = [
      place.name,
      place.admin1,
      place.country
    ]
      .filter(
        (part, index, array) =>
          part && array.indexOf(part) === index
      )
      .join(", ");

    humidityElement.textContent =
      `${current.relative_humidity_2m}%`;

    windElement.textContent =
      `${Math.round(current.wind_speed_10m)} km/h`;

    feelsLikeElement.textContent =
      `${Math.round(current.apparent_temperature)}°C`;

    updatedElement.textContent =
      `Local time: ${String(current.time).replace("T", " ")}`;

    weatherPanel.hidden = false;
    statusMessage.textContent =
      "Weather loaded successfully.";

  } catch (error) {
    weatherPanel.hidden = true;

    statusMessage.textContent =
      error.message ||
      "Something went wrong. Check your internet connection and try again.";

    console.error("Weather app error:", error);

  } finally {
    searchButton.disabled = false;
  }
}

// Handle both button clicks and Enter-key submissions.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  checkWeather(cityInput.value);
});

// Load a default city's weather when the page opens.
checkWeather("Ibadan");
