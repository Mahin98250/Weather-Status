let weatherData = null;
let chart = null;

const weatherCodes = {
    0:{icon:"☀️",text:"Clear Sky",background:"sunny"},
    1:{icon:"🌤️",text:"Mainly Clear",background:"sunny"},
    2:{icon:"⛅",text:"Partly Cloudy",background:"cloudy"},
    3:{icon:"☁️",text:"Overcast",background:"cloudy"},
    45:{icon:"🌫️",text:"Fog",background:"fog"},
    48:{icon:"🌫️",text:"Fog",background:"fog"},
    51:{icon:"🌦️",text:"Drizzle",background:"rain"},
    61:{icon:"🌧️",text:"Rain",background:"rain"},
    63:{icon:"🌧️",text:"Rain",background:"rain"},
    65:{icon:"🌧️",text:"Heavy Rain",background:"rain"},
    71:{icon:"❄️",text:"Snow",background:"snow"},
    80:{icon:"🌦️",text:"Rain Showers",background:"rain"},
    95:{icon:"⛈️",text:"Thunderstorm",background:"storm"}
};

function showLoading(){
    document.getElementById("loading")
        .classList.remove("hidden");
}

function hideLoading(){
    document.getElementById("loading")
        .classList.add("hidden");
}

async function getWeather(){

    const city =
        document.getElementById("cityInput")
        .value
        .trim();

    if(!city) return;

    showLoading();

    try{

        const response =
        await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=en&format=json`
        );

        const geoData =
        await response.json();

        if(
            !geoData.results ||
            geoData.results.length === 0
        ){
            hideLoading();
            alert("City not found");
            return;
        }

        const place =
            geoData.results[0];

        fetchWeather(
            place.latitude,
            place.longitude,
            place.name,
            place.country
        );

    }catch(error){

        console.error(error);

        hideLoading();

        alert("Search failed");
    }
}

function getCurrentLocation(){

    showLoading();

    navigator.geolocation.getCurrentPosition(

        async(position)=>{

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;

            await reverseGeocode(
                lat,
                lon
            );
        },

        (error)=>{

            console.error(error);

            hideLoading();

            alert(
                "Unable to access location"
            );
        },

        {
            enableHighAccuracy:true,
            timeout:10000,
            maximumAge:0
        }
    );
}

async function reverseGeocode(
    lat,
    lon
){

    try{

        const response =
        await fetch(
        `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`
        );

        const data =
            await response.json();

        let city =
            "Current Location";

        let country = "";

        if(
            data.results &&
            data.results.length
        ){

            city =
            data.results[0].name;

            country =
            data.results[0].country;
        }

        fetchWeather(
            lat,
            lon,
            city,
            country
        );

    }catch(error){

        console.error(error);

        fetchWeather(
            lat,
            lon,
            "Current Location",
            ""
        );
    }
}

async function fetchWeather(
    lat,
    lon,
    city,
    country
){

    try{

        const url =
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,surface_pressure&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;

        const response =
            await fetch(url);

        weatherData =
            await response.json();

        updateCurrentWeather(
            weatherData,
            city,
            country
        );

        updateMetrics(
            weatherData
        );

        updateSunData(
            weatherData
        );

        hideLoading();

    }catch(error){

        console.error(error);

        hideLoading();

        alert(
            "Weather data unavailable"
        );
    }
}

function updateCurrentWeather(
    data,
    city,
    country
){

    const weather =
    weatherCodes[
        data.current.weather_code
    ] || weatherCodes[0];

    document.getElementById(
        "cityName"
    ).textContent =
    `${city}, ${country}`;

    document.getElementById(
        "condition"
    ).textContent =
    weather.text;

    document.getElementById(
        "weatherIcon"
    ).textContent =
    weather.icon;

    document.getElementById(
        "temperature"
    ).textContent =
    `${Math.round(
        data.current.temperature_2m
    )}°`;

    document.getElementById(
        "highLow"
    ).textContent =
    `H:${Math.round(data.daily.temperature_2m_max[0])}°  L:${Math.round(data.daily.temperature_2m_min[0])}°`;

    setBackground(
        weather.background
    );
}

function setBackground(type){

    switch(type){

        case "sunny":
            document.body.style.background =
            "linear-gradient(180deg,#4facfe,#00c6ff)";
            break;

        case "cloudy":
            document.body.style.background =
            "linear-gradient(180deg,#8e9eab,#eef2f3)";
            break;

        case "rain":
            document.body.style.background =
            "linear-gradient(180deg,#4b6cb7,#182848)";
            break;

        case "storm":
            document.body.style.background =
            "linear-gradient(180deg,#232526,#414345)";
            break;

        case "snow":
            document.body.style.background =
            "linear-gradient(180deg,#d3cce3,#e9e4f0)";
            break;

        default:
            document.body.style.background =
            "linear-gradient(180deg,#4facfe,#00c6ff)";
    }
}

document
.getElementById("cityInput")
.addEventListener(
    "keypress",
    function(e){
        if(e.key === "Enter"){
            getWeather();
        }
    }
);

window.onload = ()=>{
    getCurrentLocation();
};
// ==========================================
// METRICS
// ==========================================

function updateMetrics(data){

    document.getElementById(
        "humidity"
    ).textContent =
    `${data.current.relative_humidity_2m}%`;

    document.getElementById(
        "wind"
    ).textContent =
    `${Math.round(
        data.current.wind_speed_10m
    )} km/h`;

    document.getElementById(
        "feelsLike"
    ).textContent =
    `${Math.round(
        data.current.apparent_temperature
    )}°`;

    document.getElementById(
        "pressure"
    ).textContent =
    `${Math.round(
        data.current.surface_pressure
    )} hPa`;

    const visibilityEl =
        document.getElementById(
            "visibility"
        );

    if(visibilityEl){

        visibilityEl.textContent =
        "Good";
    }

    const uvEl =
        document.getElementById("uv");

    if(uvEl){

        const temp =
            data.current.temperature_2m;

        let uv = "Low";

        if(temp > 35){
            uv = "High";
        }
        else if(temp > 28){
            uv = "Medium";
        }

        uvEl.textContent = uv;
    }

    updateHourlyForecast(data);
    updateDailyForecast(data);
    createTemperatureChart(data);
}

// ==========================================
// SUNRISE SUNSET
// ==========================================

function updateSunData(data){

    const sunrise =
        data.daily.sunrise[0];

    const sunset =
        data.daily.sunset[0];

    const sunriseTime =
        new Date(sunrise)
        .toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    const sunsetTime =
        new Date(sunset)
        .toLocaleTimeString(
            [],
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    const sunriseEl =
        document.getElementById(
            "sunrise"
        );

    const sunsetEl =
        document.getElementById(
            "sunset"
        );

    if(sunriseEl){
        sunriseEl.textContent =
        sunriseTime;
    }

    if(sunsetEl){
        sunsetEl.textContent =
        sunsetTime;
    }
}

// ==========================================
// HOURLY FORECAST
// ==========================================

function updateHourlyForecast(data){

    const container =
        document.getElementById(
            "hourlyForecast"
        );

    if(!container) return;

    container.innerHTML = "";

    const currentHour =
        new Date().getHours();

    const maxHours =
        Math.min(
            currentHour + 24,
            data.hourly.time.length
        );

    for(
        let i=currentHour;
        i<maxHours;
        i++
    ){

        const hour =
            data.hourly.time[i]
            .slice(11,16);

        const temp =
            Math.round(
                data.hourly.temperature_2m[i]
            );

        const code =
            data.hourly.weather_code[i];

        const weather =
            weatherCodes[code]
            || weatherCodes[0];

        container.innerHTML += `
            <div class="hour-card">

                <div class="hour-time">
                    ${hour}
                </div>

                <div class="hour-icon">
                    ${weather.icon}
                </div>

                <div class="hour-temp">
                    ${temp}°
                </div>

            </div>
        `;
    }
}

// ==========================================
// DAILY FORECAST
// ==========================================

function updateDailyForecast(data){

    const container =
        document.getElementById(
            "dailyForecast"
        );

    if(!container) return;

    container.innerHTML = "";

    for(
        let i=0;
        i<data.daily.time.length;
        i++
    ){

        const day =
            new Date(
                data.daily.time[i]
            ).toLocaleDateString(
                "en-US",
                {
                    weekday:"short"
                }
            );

        const code =
            data.daily.weather_code[i];

        const weather =
            weatherCodes[code]
            || weatherCodes[0];

        const maxTemp =
            Math.round(
                data.daily.temperature_2m_max[i]
            );

        const minTemp =
            Math.round(
                data.daily.temperature_2m_min[i]
            );

        container.innerHTML += `

        <div class="day-row">

            <div class="day-name">
                ${day}
            </div>

            <div class="day-icon">
                ${weather.icon}
            </div>

            <div class="day-temp">
                ${maxTemp}°
                /
                ${minTemp}°
            </div>

        </div>

        `;
    }
}

// ==========================================
// CHART.JS
// ==========================================

function createTemperatureChart(data){

    const canvas =
        document.getElementById(
            "tempChart"
        );

    if(!canvas) return;

    const labels = [];
    const temps = [];

    const currentHour =
        new Date().getHours();

    for(
        let i=currentHour;
        i<currentHour+12;
        i++
    ){

        if(
            !data.hourly.time[i]
        ) break;

        labels.push(
            data.hourly.time[i]
            .slice(11,16)
        );

        temps.push(
            data.hourly.temperature_2m[i]
        );
    }

    if(chart){
        chart.destroy();
    }

    chart = new Chart(
        canvas,
        {
            type:"line",

            data:{
                labels,

                datasets:[
                    {
                        label:"Temperature",

                        data:temps,

                        borderWidth:3,

                        tension:.4,

                        fill:false
                    }
                ]
            },

            options:{

                responsive:true,

                plugins:{
                    legend:{
                        display:false
                    }
                },

                scales:{
                    x:{
                        ticks:{
                            color:"#ffffff"
                        }
                    },

                    y:{
                        ticks:{
                            color:"#ffffff"
                        }
                    }
                }
            }
        }
    );
}
// ==========================================
// AIR QUALITY
// ==========================================

async function fetchAirQuality(
    lat,
    lon
){

    try{

        const response =
        await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`
        );

        const data =
        await response.json();

        updateAQI(data);

    }catch(error){

        console.error(
            "AQI Error:",
            error
        );
    }
}

function updateAQI(data){

    const value =
        data.current.us_aqi;

    const aqiNumber =
        document.getElementById(
            "aqiValue"
        );

    const aqiText =
        document.getElementById(
            "aqiText"
        );

    if(!aqiNumber || !aqiText)
        return;

    aqiNumber.textContent =
        Math.round(value);

    let status =
        "Good";

    if(value > 150){

        status =
        "Unhealthy";

    }else if(value > 100){

        status =
        "Poor";

    }else if(value > 50){

        status =
        "Moderate";
    }

    aqiText.textContent =
        status;
}

// ==========================================
// BETTER VISIBILITY
// ==========================================

function updateVisibility(){

    const element =
        document.getElementById(
            "visibility"
        );

    if(!element) return;

    const weatherCode =
    weatherData.current.weather_code;

    let text =
        "Excellent";

    if(
        weatherCode === 45 ||
        weatherCode === 48
    ){
        text = "Low";
    }

    if(
        weatherCode === 61 ||
        weatherCode === 63 ||
        weatherCode === 65
    ){
        text = "Moderate";
    }

    element.textContent =
        text;
}

// ==========================================
// REFRESH WEATHER
// ==========================================

function refreshWeather(){

    if(
        navigator.geolocation
    ){

        getCurrentLocation();
    }
}

// ==========================================
// AUTO REFRESH
// EVERY 10 MINUTES
// ==========================================

setInterval(
    refreshWeather,
    600000
);

// ==========================================
// IMPROVED FETCH WEATHER
// OVERRIDE OLD VERSION
// ==========================================

const originalFetchWeather =
    fetchWeather;

fetchWeather =
async function(
    lat,
    lon,
    city,
    country
){

    try{

        const url =
`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,surface_pressure&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto`;

        const response =
            await fetch(url);

        weatherData =
            await response.json();

        updateCurrentWeather(
            weatherData,
            city,
            country
        );

        updateMetrics(
            weatherData
        );

        updateSunData(
            weatherData
        );

        updateVisibility();

        fetchAirQuality(
            lat,
            lon
        );

        hideLoading();

    }catch(error){

        console.error(error);

        hideLoading();

        alert(
            "Weather unavailable"
        );
    }
};

// ==========================================
// WEATHER BACKGROUND EFFECTS
// ==========================================

function updateWeatherEffects(){

    const sky =
        document.querySelector(
            ".sky"
        );

    if(!sky) return;

    const code =
    weatherData.current.weather_code;

    sky.classList.remove(
        "rain-mode",
        "storm-mode",
        "snow-mode"
    );

    if(
        code === 61 ||
        code === 63 ||
        code === 65 ||
        code === 80
    ){

        sky.classList.add(
            "rain-mode"
        );
    }

    if(code === 95){

        sky.classList.add(
            "storm-mode"
        );
    }

    if(code === 71){

        sky.classList.add(
            "snow-mode"
        );
    }
}

// ==========================================
// RUN EFFECTS AFTER WEATHER LOAD
// ==========================================

const oldUpdateCurrentWeather =
    updateCurrentWeather;

updateCurrentWeather =
function(
    data,
    city,
    country
){

    oldUpdateCurrentWeather(
        data,
        city,
        country
    );

    updateWeatherEffects();
};

// ==========================================
// READY
// ==========================================

console.log(
    "Weather Status Loaded"
);
