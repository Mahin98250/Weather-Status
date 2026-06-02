const weatherIcons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    71: "❄️",
    73: "❄️",
    75: "❄️",
    80: "🌦️",
    81: "🌦️",
    82: "🌧️",
    95: "⛈️"
};

async function getWeather() {

    const city = document.getElementById("cityInput").value;

    if (!city) return;

    const geoURL =
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

    const geoData = await fetch(geoURL).then(res => res.json());

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
}

function getCurrentLocation() {

    navigator.geolocation.getCurrentPosition(pos => {

        fetchWeather(
            pos.coords.latitude,
            pos.coords.longitude,
            "Current Location",
            ""
        );

    });

}

async function fetchWeather(lat, lon, city, country) {

    const url =
        `https://api.open-meteo.com/v1/forecast
        ?latitude=${lat}
        &longitude=${lon}
        &current=temperature_2m,weather_code,wind_speed_10m
        &hourly=temperature_2m
        &daily=weather_code,temperature_2m_max,temperature_2m_min
        &forecast_days=7
        &timezone=auto`
        .replace(/\s+/g,'');

    const data = await fetch(url).then(res => res.json());

    showCurrentWeather(data, city, country);
    showHourly(data);
    showDaily(data);
}

function showCurrentWeather(data, city, country) {

    const icon =
        weatherIcons[data.current.weather_code] || "🌍";

    document.getElementById("currentWeather").innerHTML = `
        <div class="card">
            <h2>${city} ${country}</h2>

            <div class="weather-icon">
                ${icon}
            </div>

            <div class="temp">
                ${data.current.temperature_2m}°C
            </div>

            <p>
                Wind:
                ${data.current.wind_speed_10m} km/h
            </p>
        </div>
    `;
}

function showHourly(data) {

    let html = "";

    for(let i=0;i<12;i++){

        html += `
        <div class="hour-card">
            <p>${data.hourly.time[i].slice(11,16)}</p>
            <h3>${data.hourly.temperature_2m[i]}°</h3>
        </div>
        `;
    }

    document.getElementById("hourlyForecast").innerHTML =
        html;
}

function showDaily(data) {

    let html = "";

    for(let i=0;i<7;i++){

        const icon =
            weatherIcons[data.daily.weather_code[i]] || "☀️";

        html += `
        <div class="day-card">
            <span>${icon}</span>
            <span>${data.daily.time[i]}</span>
            <span>
                ${data.daily.temperature_2m_max[i]}°
                /
                ${data.daily.temperature_2m_min[i]}°
            </span>
        </div>
        `;
    }

    document.getElementById("dailyForecast").innerHTML =
        html;
}

getCurrentLocation();
