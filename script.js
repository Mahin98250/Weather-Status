// ================================
// APPLE WEATHER STYLE SCRIPT
// Open-Meteo Integration
// ================================

const weatherCodes = {
  0: { icon: "☀️", text: "Clear Sky", bg: "sunny" },
  1: { icon: "🌤️", text: "Mainly Clear", bg: "sunny" },
  2: { icon: "⛅", text: "Partly Cloudy", bg: "cloudy" },
  3: { icon: "☁️", text: "Overcast", bg: "cloudy" },
  45: { icon: "🌫️", text: "Fog", bg: "cloudy" },
  48: { icon: "🌫️", text: "Fog", bg: "cloudy" },
  51: { icon: "🌦️", text: "Light Drizzle", bg: "rain" },
  61: { icon: "🌧️", text: "Rain", bg: "rain" },
  63: { icon: "🌧️", text: "Rain", bg: "rain" },
  65: { icon: "🌧️", text: "Heavy Rain", bg: "rain" },
  71: { icon: "❄️", text: "Snow", bg: "snow" },
  73: { icon: "❄️", text: "Snow", bg: "snow" },
  75: { icon: "❄️", text: "Heavy Snow", bg: "snow" },
  80: { icon: "🌦️", text: "Rain Showers", bg: "rain" },
  81: { icon: "🌧️", text: "Rain Showers", bg: "rain" },
  82: { icon: "🌧️", text: "Heavy Showers", bg: "rain" },
  95: { icon: "⛈️", text: "Thunderstorm", bg: "storm" }
};

// ================================
// SEARCH WEATHER
// ================================

async function getWeather() {

  const city = document.getElementById("cityInput").value.trim();

  if (!city) return;

  try {

    const geoURL =
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

    const geoData = await fetch(geoURL).then(r => r.json());

    if (!geoData.results) {
      alert("City not found");
      return;
    }

    const place = geoData.results[0];

    fetchWeather(
      place.latitude,
      place.longitude,
      place.name,
      place.country
    );

  } catch (err) {
    console.error(err);
    alert("Failed to fetch location");
  }
}

// ================================
// CURRENT LOCATION
// ================================

function getCurrentLocation() {

  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(

    pos => {

      fetchWeather(
        pos.coords.latitude,
        pos.coords.longitude,
        "Current Location",
        ""
      );

    },

    () => {
      alert("Location permission denied");
    }

  );
}

// ================================
// FETCH WEATHER
// ================================

async function fetchWeather(lat, lon, city, country) {

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}
    &longitude=${lon}
    &current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m
    &hourly=temperature_2m,weather_code
    &daily=weather_code,temperature_2m_max,temperature_2m_min
    &timezone=auto`
    .replace(/\s+/g, "");

  try {

    const data = await fetch(url).then(r => r.json());

    updateCurrent(data, city, country);
    updateHourly(data);
    updateDaily(data);
    updateMetrics(data);

  } catch (err) {

    console.error(err);
    alert("Weather API Error");

  }
}

// ================================
// CURRENT WEATHER
// ================================

function updateCurrent(data, city, country) {

  const weather =
    weatherCodes[data.current.weather_code] ||
    weatherCodes[0];

  document.getElementById("cityName").textContent =
    `${city} ${country}`;

  document.getElementById("condition").textContent =
    weather.text;

  document.getElementById("weatherIcon").textContent =
    weather.icon;

  document.getElementById("temperature").textContent =
    `${Math.round(data.current.temperature_2m)}°`;

  document.getElementById("highLow").textContent =
    `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;

  setBackground(weather.bg);
}

// ================================
// METRICS
// ================================

function updateMetrics(data) {

  document.getElementById("humidity").textContent =
    `${data.current.relative_humidity_2m}%`;

  document.getElementById("wind").textContent =
    `${Math.round(data.current.wind_speed_10m)} km/h`;

  document.getElementById("feelsLike").textContent =
    `${Math.round(data.current.apparent_temperature)}°`;

  const temp = data.current.temperature_2m;

  let uv = "Low";

  if (temp > 35) uv = "High";
  else if (temp > 28) uv = "Medium";

  document.getElementById("uv").textContent = uv;
}

// ================================
// HOURLY FORECAST
// ================================

function updateHourly(data) {

  const container =
    document.getElementById("hourlyForecast");

  container.innerHTML = "";

  for (let i = 0; i < 12; i++) {

    const hour =
      data.hourly.time[i].slice(11, 16);

    const icon =
      weatherCodes[data.hourly.weather_code[i]]
      ?.icon || "☀️";

    const temp =
      Math.round(
        data.hourly.temperature_2m[i]
      );

    container.innerHTML += `
      <div class="hour-card">

          <div class="hour-time">
            ${hour}
          </div>

          <div class="hour-icon">
            ${icon}
          </div>

          <div class="hour-temp">
            ${temp}°
          </div>

      </div>
    `;
  }
}

// ================================
// DAILY FORECAST
// ================================

function updateDaily(data) {

  const container =
    document.getElementById("dailyForecast");

  container.innerHTML = "";

  for (let i = 0; i < 10; i++) {

    const date =
      new Date(data.daily.time[i]);

    const day =
      date.toLocaleDateString(
        "en-US",
        { weekday: "short" }
      );

    const icon =
      weatherCodes[data.daily.weather_code[i]]
      ?.icon || "☀️";

    container.innerHTML += `
      <div class="day-row">

        <div class="day-name">
          ${day}
        </div>

        <div class="day-icon">
          ${icon}
        </div>

        <div class="day-temp">
          ${Math.round(data.daily.temperature_2m_max[i])}°
          /
          ${Math.round(data.daily.temperature_2m_min[i])}°
        </div>

      </div>
    `;
  }
}

// ================================
// DYNAMIC BACKGROUND
// ================================

function setBackground(type) {

  const body = document.body;

  switch(type){

    case "sunny":
      body.style.background =
      "linear-gradient(180deg,#4facfe,#00c6ff)";
      break;

    case "cloudy":
      body.style.background =
      "linear-gradient(180deg,#8e9eab,#eef2f3)";
      break;

    case "rain":
      body.style.background =
      "linear-gradient(180deg,#4b6cb7,#182848)";
      break;

    case "storm":
      body.style.background =
      "linear-gradient(180deg,#232526,#414345)";
      break;

    case "snow":
      body.style.background =
      "linear-gradient(180deg,#d3cce3,#e9e4f0)";
      break;
  }
}

// ================================
// ENTER KEY SUPPORT
// ================================

document
.getElementById("cityInput")
.addEventListener("keypress", e => {

  if (e.key === "Enter") {
    getWeather();
  }

});

// ================================
// AUTO LOAD LOCATION
// ================================

window.onload = () => {
  getCurrentLocation();
};
