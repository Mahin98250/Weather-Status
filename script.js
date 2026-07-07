/* ========================================
   WEATHER STATUS APP - ENHANCED SCRIPT
   Apple iOS 26 Design & Animations
   ======================================== */

let weatherData = null;
let chart = null;
let currentCity = null;
let currentCountry = null;

// ========================================
// WEATHER CODE MAPPING
// ========================================

const weatherCodes = {
    0: { icon: "☀️", text: "Clear Sky", theme: "sunny", intensity: 1 },
    1: { icon: "🌤️", text: "Mainly Clear", theme: "sunny", intensity: 0.8 },
    2: { icon: "⛅", text: "Partly Cloudy", theme: "cloudy", intensity: 0.6 },
    3: { icon: "☁️", text: "Overcast", theme: "cloudy", intensity: 0.5 },
    45: { icon: "🌫️", text: "Foggy", theme: "fog", intensity: 0.4 },
    48: { icon: "🌫️", text: "Depositing Rime Fog", theme: "fog", intensity: 0.4 },
    51: { icon: "🌦️", text: "Light Drizzle", theme: "rain", intensity: 0.5 },
    53: { icon: "🌦️", text: "Drizzle", theme: "rain", intensity: 0.6 },
    55: { icon: "🌧️", text: "Heavy Drizzle", theme: "rain", intensity: 0.7 },
    61: { icon: "🌧️", text: "Slight Rain", theme: "rain", intensity: 0.7 },
    63: { icon: "🌧️", text: "Moderate Rain", theme: "rain", intensity: 0.8 },
    65: { icon: "⛈️", text: "Heavy Rain", theme: "rain", intensity: 0.9 },
    71: { icon: "❄️", text: "Slight Snow", theme: "snow", intensity: 0.7 },
    73: { icon: "❄️", text: "Snow", theme: "snow", intensity: 0.8 },
    75: { icon: "❄️", text: "Heavy Snow", theme: "snow", intensity: 0.9 },
    77: { icon: "❄️", text: "Snow Grains", theme: "snow", intensity: 0.8 },
    80: { icon: "🌦️", text: "Rain Showers", theme: "rain", intensity: 0.7 },
    81: { icon: "⛈️", text: "Heavy Rain Showers", theme: "rain", intensity: 0.9 },
    82: { icon: "⛈️", text: "Violent Rain Showers", theme: "storm", intensity: 1 },
    85: { icon: "❄️", text: "Light Snow Showers", theme: "snow", intensity: 0.7 },
    86: { icon: "❄️", text: "Heavy Snow Showers", theme: "snow", intensity: 0.9 },
    95: { icon: "⛈️", text: "Thunderstorm", theme: "storm", intensity: 1 },
    96: { icon: "⛈️", text: "Thunderstorm with Hail", theme: "storm", intensity: 1 },
    99: { icon: "⛈️", text: "Thunderstorm with Heavy Hail", theme: "storm", intensity: 1 }
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('Weather App Initialized');
    getCurrentLocation();
    
    // Setup Enter key for search
    document.getElementById('cityInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getWeather();
        }
    });
});

// ========================================
// LOADING STATE
// ========================================

function showLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        loader.classList.remove('hidden');
        loader.style.opacity = '1';
    }
}

function hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
        setTimeout(() => {
            loader.classList.add('hidden');
            loader.style.opacity = '0';
        }, 300);
    }
}

// ========================================
// LOCATION SERVICES
// ========================================

function getCurrentLocation() {
    showLoading();
    
    if (!navigator.geolocation) {
        hideLoading();
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            await reverseGeocode(lat, lon);
        },
        (error) => {
            console.error('Geolocation error:', error);
            hideLoading();
            alert('Unable to access your location. Please search for a city.');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en`
        );
        const data = await response.json();

        let city = 'Current Location';
        let country = '';

        if (data.results && data.results.length > 0) {
            city = data.results[0].name;
            country = data.results[0].country || '';
        }

        fetchWeather(lat, lon, city, country);
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        fetchWeather(lat, lon, 'Current Location', '');
    }
}

async function getWeather() {
    const city = document.getElementById('cityInput').value.trim();

    if (!city) {
        alert('Please enter a city name');
        return;
    }

    showLoading();

    try {
        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const geoData = await response.json();

        if (!geoData.results || geoData.results.length === 0) {
            hideLoading();
            alert('City not found. Please try another search.');
            return;
        }

        const place = geoData.results[0];
        fetchWeather(place.latitude, place.longitude, place.name, place.country);
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        alert('Search failed. Please try again.');
    }
}

// ========================================
// WEATHER API FETCH
// ========================================

async function fetchWeather(lat, lon, city, country) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,surface_pressure,visibility,uv_index&hourly=temperature_2m,weather_code,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum&timezone=auto`;

        const response = await fetch(url);
        weatherData = await response.json();

        currentCity = city;
        currentCountry = country;

        updateCurrentWeather(weatherData, city, country);
        updateMetrics(weatherData);
        updateSunData(weatherData);
        updateTheme(weatherData);
        await fetchAirQuality(lat, lon);

        hideLoading();
    } catch (error) {
        console.error('Weather fetch error:', error);
        hideLoading();
        alert('Failed to fetch weather data. Please try again.');
    }
}

// ========================================
// THEME SYSTEM
// ========================================

function updateTheme(data) {
    const weatherCode = data.current.weather_code;
    const weather = weatherCodes[weatherCode] || weatherCodes[0];
    const theme = weather.theme;

    // Remove previous theme
    document.body.className = document.body.className.replace(/\b(sunny|cloudy|rain|storm|snow|night|fog)\b/g, '');
    
    // Add new theme
    document.body.classList.add(theme);

    // Update background effects
    updateWeatherEffects(data);
}

function updateWeatherEffects(data) {
    const weatherCode = data.current.weather_code;
    const weather = weatherCodes[weatherCode] || weatherCodes[0];

    if (weather.theme === 'rain' || weather.theme === 'storm') {
        createRainEffect();
    } else if (weather.theme === 'snow') {
        createSnowEffect();
    }
}

function createRainEffect() {
    const rainContainer = document.querySelector('.rain-container');
    if (!rainContainer) return;

    rainContainer.innerHTML = '';
    const raindrops = 50;

    for (let i = 0; i < raindrops; i++) {
        const raindrop = document.createElement('div');
        raindrop.className = 'raindrop';
        raindrop.style.cssText = `
            position: absolute;
            width: 2px;
            height: ${10 + Math.random() * 10}px;
            background: rgba(255, 255, 255, 0.5);
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: fall ${0.5 + Math.random() * 0.5}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        rainContainer.appendChild(raindrop);
    }

    // Add keyframes if not already in stylesheet
    if (!document.getElementById('rain-keyframes')) {
        const style = document.createElement('style');
        style.id = 'rain-keyframes';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(100vh) translateX(${(Math.random() - 0.5) * 100}px);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function createSnowEffect() {
    const snowContainer = document.querySelector('.snow-container');
    if (!snowContainer) return;

    snowContainer.innerHTML = '';
    const snowflakes = 40;

    for (let i = 0; i < snowflakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = '❄';
        snowflake.style.cssText = `
            position: absolute;
            font-size: ${10 + Math.random() * 10}px;
            left: ${Math.random() * 100}%;
            top: -10px;
            opacity: ${0.5 + Math.random() * 0.5};
            animation: snowfall ${5 + Math.random() * 3}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        snowContainer.appendChild(snowflake);
    }

    if (!document.getElementById('snow-keyframes')) {
        const style = document.createElement('style');
        style.id = 'snow-keyframes';
        style.textContent = `
            @keyframes snowfall {
                to {
                    transform: translateY(100vh) translateX(${(Math.random() - 0.5) * 100}px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// ========================================
// UPDATE CURRENT WEATHER
// ========================================

function updateCurrentWeather(data, city, country) {
    const weather = weatherCodes[data.current.weather_code] || weatherCodes[0];

    // Location
    document.getElementById('cityName').textContent = `${city}${country ? ', ' + country : ''}`;
    document.getElementById('condition').textContent = weather.text;
    document.getElementById('weatherIcon').textContent = weather.icon;

    // Temperature
    const temp = Math.round(data.current.temperature_2m);
    const feelsLike = Math.round(data.current.apparent_temperature);
    
    document.getElementById('temperature').textContent = `${temp}°`;
    document.getElementById('feelsLike').textContent = `Feels like ${feelsLike}°`;
    document.getElementById('feelsLike-full').textContent = `${feelsLike}°`;

    // High/Low
    const high = Math.round(data.daily.temperature_2m_max[0]);
    const low = Math.round(data.daily.temperature_2m_min[0]);
    document.getElementById('highLow').textContent = `H:${high}° L:${low}°`;

    // Quick stats in hero
    document.getElementById('humidity-quick').textContent = `${data.current.relative_humidity_2m}%`;
    document.getElementById('wind-quick').textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
}

// ========================================
// UPDATE METRICS
// ========================================

function updateMetrics(data) {
    const current = data.current;

    // Humidity
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;

    // Wind
    document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;

    // Pressure
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;

    // Visibility
    const visibility = current.visibility ? `${Math.round(current.visibility / 1000)} km` : 'Good';
    document.getElementById('visibility').textContent = visibility;

    // UV Index
    const uv = current.uv_index || data.daily.uv_index_max[0];
    let uvText = 'Low';
    if (uv > 8) uvText = 'Very High';
    else if (uv > 6) uvText = 'High';
    else if (uv > 3) uvText = 'Moderate';
    else if (uv > 0) uvText = 'Low';
    
    document.getElementById('uv').textContent = uvText;

    // Update hourly, daily, and chart
    updateHourlyForecast(data);
    updateDailyForecast(data);
    createTemperatureChart(data);
}

// ========================================
// SUNRISE & SUNSET
// ========================================

function updateSunData(data) {
    const sunrise = new Date(data.daily.sunrise[0]).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const sunset = new Date(data.daily.sunset[0]).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;
}

// ========================================
// HOURLY FORECAST
// ========================================

function updateHourlyForecast(data) {
    const container = document.getElementById('hourlyForecast');
    if (!container) return;

    container.innerHTML = '';

    const currentHour = new Date().getHours();
    const maxHours = Math.min(currentHour + 24, data.hourly.time.length);

    for (let i = currentHour; i < maxHours; i++) {
        const time = data.hourly.time[i];
        const hour = new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(data.hourly.temperature_2m[i]);
        const code = data.hourly.weather_code[i];
        const weather = weatherCodes[code] || weatherCodes[0];

        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <div class="hour-time">${hour}</div>
            <div class="hour-icon">${weather.icon}</div>
            <div class="hour-temp">${temp}°</div>
        `;
        container.appendChild(card);
    }
}

// ========================================
// DAILY FORECAST
// ========================================

function updateDailyForecast(data) {
    const container = document.getElementById('dailyForecast');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < Math.min(10, data.daily.time.length); i++) {
        const time = data.daily.time[i];
        const day = new Date(time).toLocaleDateString('en-US', { weekday: 'short' });
        const code = data.daily.weather_code[i];
        const weather = weatherCodes[code] || weatherCodes[0];
        const high = Math.round(data.daily.temperature_2m_max[i]);
        const low = Math.round(data.daily.temperature_2m_min[i]);
        const rain = data.daily.precipitation_sum[i] || 0;
        const rainChance = Math.round(rain * 10); // Simple calculation

        const row = document.createElement('div');
        row.className = 'day-row';
        row.innerHTML = `
            <div class="day-name">${day}</div>
            <div class="day-icon">${weather.icon}</div>
            <div class="day-temp">
                <div class="day-temp-high">${high}°</div>
                <div style="font-size: 12px; color: var(--text-tertiary);">${low}°</div>
            </div>
            <div class="day-chance">${rainChance > 0 ? rainChance + '%' : 'Clear'}</div>
        `;
        container.appendChild(row);
    }
}

// ========================================
// TEMPERATURE CHART
// ========================================

function createTemperatureChart(data) {
    const canvas = document.getElementById('tempChart');
    if (!canvas) return;

    const labels = [];
    const temps = [];

    const currentHour = new Date().getHours();

    for (let i = currentHour; i < Math.min(currentHour + 24, data.hourly.time.length); i++) {
        labels.push(data.hourly.time[i].slice(11, 16));
        temps.push(Math.round(data.hourly.temperature_2m[i]));
    }

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Temperature',
                    data: temps,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: 'rgba(255, 255, 255, 0.9)',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value + '°';
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// AIR QUALITY
// ========================================

async function fetchAirQuality(lat, lon) {
    try {
        const response = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
        );

        const data = await response.json();
        updateAQI(data);
    } catch (error) {
        console.error('Air quality fetch error:', error);
        document.getElementById('aqiValue').textContent = '--';
    }
}

function updateAQI(data) {
    const aqi = Math.round(data.current.us_aqi);
    document.getElementById('aqiValue').textContent = aqi;

    let status = 'Good';
    if (aqi > 150) status = 'Unhealthy';
    else if (aqi > 100) status = 'Poor';
    else if (aqi > 50) status = 'Moderate';

    console.log(`Air Quality: ${aqi} - ${status}`);
}

// ========================================
// AUTO REFRESH
// ========================================

setInterval(() => {
    if (weatherData) {
        console.log('Auto-refreshing weather data...');
        getCurrentLocation();
    }
}, 600000); // 10 minutes

console.log('Weather Status App Loaded Successfully');
