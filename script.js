// ==========================================
// WEATHER APP - MODERN VANILLA JS
// ==========================================

const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEO = 'https://geocoding-api.open-meteo.com/v1/reverse';
const AQI_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const WEATHER_CODES = {
    0: { icon: '☀️', text: 'Clear', theme: 'sunny' },
    1: { icon: '🌤️', text: 'Mainly Clear', theme: 'sunny' },
    2: { icon: '⛅', text: 'Partly Cloudy', theme: 'cloudy' },
    3: { icon: '☁️', text: 'Overcast', theme: 'cloudy' },
    45: { icon: '🌫️', text: 'Foggy', theme: 'fog' },
    48: { icon: '🌫️', text: 'Foggy', theme: 'fog' },
    51: { icon: '🌦️', text: 'Light Drizzle', theme: 'rain' },
    53: { icon: '🌦️', text: 'Drizzle', theme: 'rain' },
    55: { icon: '🌧️', text: 'Heavy Drizzle', theme: 'rain' },
    61: { icon: '🌧️', text: 'Light Rain', theme: 'rain' },
    63: { icon: '🌧️', text: 'Rain', theme: 'rain' },
    65: { icon: '⛈️', text: 'Heavy Rain', theme: 'rain' },
    71: { icon: '❄️', text: 'Light Snow', theme: 'snow' },
    73: { icon: '❄️', text: 'Snow', theme: 'snow' },
    75: { icon: '❄️', text: 'Heavy Snow', theme: 'snow' },
    80: { icon: '🌦️', text: 'Showers', theme: 'rain' },
    81: { icon: '⛈️', text: 'Heavy Showers', theme: 'rain' },
    82: { icon: '⛈️', text: 'Violent Showers', theme: 'storm' },
    85: { icon: '❄️', text: 'Light Snow Showers', theme: 'snow' },
    86: { icon: '❄️', text: 'Snow Showers', theme: 'snow' },
    95: { icon: '⛈️', text: 'Thunderstorm', theme: 'storm' },
    96: { icon: '⛈️', text: 'Thunderstorm', theme: 'storm' },
    99: { icon: '⛈️', text: 'Thunderstorm', theme: 'storm' }
};

let weatherData = null;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Load theme preference
    const theme = localStorage.getItem('theme') || 'dark';
    setTheme(theme);

    // Event Listeners
    document.getElementById('searchBtn').addEventListener('click', searchWeather);
    document.getElementById('locBtn').addEventListener('click', getLocation);
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('cityInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchWeather();
    });

    // Load weather
    getLocation();

    // Auto-refresh every 10 minutes
    setInterval(() => {
        if (weatherData) getLocation();
    }, 600000);
});

// ==========================================
// THEME MANAGEMENT
// ==========================================

function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeBtn').textContent = '☀️';
    } else {
        document.body.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeBtn').textContent = '🌙';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('light');
    setTheme(isDark ? 'dark' : 'light');
}

// ==========================================
// LOADING STATE
// ==========================================

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// ==========================================
// LOCATION & GEOLOCATION
// ==========================================

function getLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }

    showLoading();
    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            reverseGeocode(latitude, longitude);
        },
        (err) => {
            console.error('Geolocation error:', err);
            hideLoading();
            // Fallback to a default city
            searchByCity('London');
        }
    );
}

async function reverseGeocode(lat, lon) {
    try {
        const res = await fetch(`${REVERSE_GEO}?latitude=${lat}&longitude=${lon}&language=en`);
        const data = await res.json();
        const city = data.results?.[0]?.name || 'Current Location';
        const country = data.results?.[0]?.country || '';
        fetchWeather(lat, lon, city, country);
    } catch (err) {
        console.error('Reverse geocode error:', err);
        fetchWeather(lat, lon, 'Current Location', '');
    }
}

async function searchWeather() {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
        alert('Enter a city name');
        return;
    }
    searchByCity(city);
}

async function searchByCity(city) {
    showLoading();
    try {
        const res = await fetch(`${GEO_API}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await res.json();

        if (!data.results?.length) {
            hideLoading();
            alert('City not found');
            return;
        }

        const { latitude, longitude, name, country } = data.results[0];
        fetchWeather(latitude, longitude, name, country);
    } catch (err) {
        console.error('Search error:', err);
        hideLoading();
        alert('Search failed');
    }
}

// ==========================================
// FETCH WEATHER DATA
// ==========================================

async function fetchWeather(lat, lon, city, country) {
    try {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lon,
            current: 'temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,surface_pressure,visibility,uv_index',
            hourly: 'temperature_2m,weather_code,precipitation',
            daily: 'temperature_2m_max,temperature_2m_min,weather_code,sunrise,sunset,precipitation_sum,uv_index_max',
            timezone: 'auto',
            forecast_days: 5
        });

        const res = await fetch(`${API_BASE}?${params}`);
        weatherData = await res.json();

        updateUI(city, country);
        fetchAQI(lat, lon);
        updateThemeByWeather();
    } catch (err) {
        console.error('Weather fetch error:', err);
        alert('Failed to fetch weather');
    } finally {
        hideLoading();
    }
}

// ==========================================
// FETCH AIR QUALITY
// ==========================================

async function fetchAQI(lat, lon) {
    try {
        const res = await fetch(`${AQI_API}?latitude=${lat}&longitude=${lon}&current=us_aqi`);
        const data = await res.json();
        const aqi = Math.round(data.current?.us_aqi || 0);
        document.getElementById('aqi').textContent = aqi > 0 ? `${aqi}` : '--';
    } catch (err) {
        console.error('AQI error:', err);
    }
}

// ==========================================
// UPDATE THEME
// ==========================================

function updateThemeByWeather() {
    const code = weatherData.current.weather_code;
    const theme = WEATHER_CODES[code]?.theme || 'sunny';
    const isDark = document.body.classList.contains('light');

    document.body.className = document.body.className.replace(/\b(sunny|cloudy|rain|storm|snow|fog)\b/g, '');
    document.body.classList.add(theme);

    if (isDark) document.body.classList.add('light');

    // Visual effects
    if (theme === 'rain' || theme === 'storm') {
        createRain();
    } else if (theme === 'snow') {
        createSnow();
    } else {
        document.querySelector('.rain-container').innerHTML = '';
        document.querySelector('.snow-container').innerHTML = '';
    }
}

function createRain() {
    const container = document.querySelector('.rain-container');
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
        const drop = document.createElement('div');
        drop.style.cssText = `
            position: absolute;
            width: 1px;
            height: ${8 + Math.random() * 8}px;
            background: rgba(255,255,255,0.4);
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: fall ${0.4 + Math.random() * 0.2}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        container.appendChild(drop);
    }
}

function createSnow() {
    const container = document.querySelector('.snow-container');
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const flake = document.createElement('div');
        flake.textContent = '❄';
        flake.style.cssText = `
            position: absolute;
            font-size: ${8 + Math.random() * 8}px;
            left: ${Math.random() * 100}%;
            top: -10px;
            opacity: ${0.5 + Math.random() * 0.5};
            animation: snowfall ${6 + Math.random() * 4}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        container.appendChild(flake);
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to { transform: translateY(100vh); }
    }
    @keyframes snowfall {
        to {
            transform: translateY(100vh) translateX(${(Math.random()-0.5)*50}px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==========================================
// UPDATE UI
// ==========================================

function updateUI(city, country) {
    const { current, hourly, daily } = weatherData;
    const code = current.weather_code;
    const weather = WEATHER_CODES[code] || WEATHER_CODES[0];
    const temp = Math.round(current.temperature_2m);
    const feelsLike = Math.round(current.apparent_temperature);
    const high = Math.round(daily.temperature_2m_max[0]);
    const low = Math.round(daily.temperature_2m_min[0]);

    // Header
    document.getElementById('cityName').textContent = `${city}${country ? ', ' + country : ''}`;
    document.getElementById('condition').textContent = weather.text;
    document.getElementById('weatherIcon').textContent = weather.icon;
    document.getElementById('temperature').textContent = `${temp}°`;
    document.getElementById('feelsLike').textContent = `${feelsLike}°`;
    document.getElementById('feelsLike-full').textContent = `${feelsLike}°`;
    document.getElementById('highLow').textContent = `H:${high}° L:${low}°`;

    // Quick stats
    document.getElementById('humidity-quick').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-quick').textContent = `${Math.round(current.wind_speed_10m)} km/h`;

    // Metrics
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('pressure').textContent = `${Math.round(current.surface_pressure)} hPa`;
    document.getElementById('visibility').textContent = `${Math.round(current.visibility / 1000)} km`;

    // UV Index
    const uv = current.uv_index || daily.uv_index_max[0];
    let uvText = 'Low';
    if (uv > 8) uvText = 'Very High';
    else if (uv > 6) uvText = 'High';
    else if (uv > 3) uvText = 'Moderate';
    document.getElementById('uv').textContent = uvText;

    // Sunrise/Sunset
    const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunrise').textContent = sunrise;
    document.getElementById('sunset').textContent = sunset;

    // Hourly
    updateHourly();

    // Daily
    updateDaily();
}

function updateHourly() {
    const container = document.getElementById('hourlyForecast');
    container.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours();
    const { hourly } = weatherData;

    for (let i = currentHour; i < Math.min(currentHour + 24, hourly.time.length); i++) {
        const time = hourly.time[i];
        const hour = new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weather_code[i];
        const weather = WEATHER_CODES[code] || WEATHER_CODES[0];

        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <small>${hour}</small>
            <span class="icon">${weather.icon}</span>
            <b>${temp}°</b>
        `;
        container.appendChild(card);
    }
}

function updateDaily() {
    const container = document.getElementById('dailyForecast');
    container.innerHTML = '';
    const { daily } = weatherData;

    for (let i = 0; i < Math.min(5, daily.time.length); i++) {
        const time = daily.time[i];
        const day = new Date(time).toLocaleDateString('en-US', { weekday: 'short' });
        const code = daily.weather_code[i];
        const weather = WEATHER_CODES[code] || WEATHER_CODES[0];
        const high = Math.round(daily.temperature_2m_max[i]);
        const low = Math.round(daily.temperature_2m_min[i]);

        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <small>${day}</small>
            <span class="icon">${weather.icon}</span>
            <div class="temps"><span class="high">${high}°</span> ${low}°</div>
        `;
        container.appendChild(card);
    }
}

console.log('Weather App Ready ✓');