const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const statusEl = document.getElementById('status');
const statusText = document.getElementById('status-text');
const retryBtn = document.getElementById('retry-btn');
const resultEl = document.getElementById('result');
const suggestions = document.getElementById('suggestions');

const LAST_CITY_KEY = 'weather:last-city';
let lastCity = '';

const apiKey = typeof OPENWEATHER_API_KEY === 'string' ? OPENWEATHER_API_KEY.trim() : '';
const fetchWeather = apiKey
  ? (city) => OpenWeatherMap.loadWeather(city, apiKey)
  : (city) => OpenMeteo.loadWeather(city);

function setStatus(state, message = '', { canRetry = false } = {}) {
  statusEl.dataset.state = state;
  statusText.textContent = message;
  retryBtn.hidden = !canRetry;

  const busy = state === 'loading';
  searchBtn.disabled = busy;
  input.readOnly = busy;
  statusEl.setAttribute('aria-busy', String(busy));
  resultEl.classList.toggle('is-stale', busy);
}

function friendly(err, city) {
  switch (err.kind) {
    case 'not-found':
      return { message: `We couldn't find a city called "${city}". Check the spelling and try again.`, canRetry: false };
    case 'network':
      return { message: "Couldn't reach the weather service. Check your internet connection.", canRetry: true };
    case 'timeout':
      return { message: 'The weather service is taking too long to answer.', canRetry: true };
    case 'rate-limit':
      return { message: 'Too many requests right now. Wait a minute, then try again.', canRetry: true };
    case 'auth':
      return {
        message: 'The API key was rejected. Check js/config.js — new OpenWeatherMap keys can take up to 2 hours to activate.',
        canRetry: false,
      };
    case 'server':
      return { message: `The weather service is having problems (HTTP ${err.status}). Try again shortly.`, canRetry: true };
    default:
      return { message: 'Something went wrong while loading the weather.', canRetry: true };
  }
}

async function search(rawCity) {
  const city = rawCity.trim().replace(/\s+/g, ' ');

  if (!city) {
    setStatus('error', 'Type a city name first — for example "Beirut".');
    input.focus();
    return;
  }

  lastCity = city;
  setStatus('loading', `Loading weather for ${city}…`);

  try {
    const data = await fetchWeather(city);
    renderWeather(data);
    setStatus('success', `Showing ${data.place.name}${data.place.country ? `, ${data.place.country}` : ''}.`);
    saveLastCity(data.place.name);
  } catch (err) {
    const { message, canRetry } = friendly(err, city);
    setStatus('error', message, { canRetry });
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  search(input.value);
});

retryBtn.addEventListener('click', () => search(lastCity));

suggestions.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-city]');
  if (!button || searchBtn.disabled) return;
  input.value = button.dataset.city;
  search(button.dataset.city);
});

function saveLastCity(city) {
  try {
    localStorage.setItem(LAST_CITY_KEY, city);
  } catch {
  }
}

function readLastCity() {
  try {
    return localStorage.getItem(LAST_CITY_KEY) ?? '';
  } catch {
    return '';
  }
}

const startCity = new URLSearchParams(location.search).get('city') || readLastCity();
if (startCity) {
  input.value = startCity;
  search(startCity);
} else {
  setStatus('idle', 'Search for a city to see its weather.');
}
