const OpenWeatherMap = (() => {
  const BASE = 'https://api.openweathermap.org/data/2.5';
  const FORECAST_DAYS = 5;

  async function loadWeather(city, apiKey) {
    const params = new URLSearchParams({ q: city, units: 'metric', appid: apiKey });

    const [now, forecast] = await Promise.all([
      getJSON(`${BASE}/weather?${params}`),
      getJSON(`${BASE}/forecast?${params}`),
    ]);

    const condition = now.weather?.[0] ?? {};
    const tz = now.timezone;

    return {
      source: 'OpenWeatherMap',
      place: { name: now.name, country: countryName(now.sys?.country) },
      current: {
        temp: now.main.temp,
        feelsLike: now.main.feels_like,
        humidity: now.main.humidity,
        windKmh: now.wind.speed * 3.6,
        description: condition.description ?? '—',
        icon: condition.icon ?? '01d',

        localTime: new Date((now.dt + tz) * 1000),
      },
      daily: groupByDay(forecast.list, forecast.city.timezone).slice(0, FORECAST_DAYS),
    };
  }

  function groupByDay(list, tz) {
    const days = new Map();

    for (const step of list) {
      const local = new Date((step.dt + tz) * 1000);
      const key = local.toISOString().slice(0, 10);
      const day = days.get(key) ?? { date: local, min: Infinity, max: -Infinity, steps: [] };
      day.min = Math.min(day.min, step.main.temp_min);
      day.max = Math.max(day.max, step.main.temp_max);
      day.steps.push({ hour: local.getUTCHours(), weather: step.weather[0] });
      days.set(key, day);
    }

    return [...days.values()].map(({ date, min, max, steps }) => {
      const midday = steps.reduce((best, s) =>
        Math.abs(s.hour - 12) < Math.abs(best.hour - 12) ? s : best
      );
      return {
        date,
        min,
        max,
        description: midday.weather.description,
        icon: midday.weather.icon.replace('n', 'd'),
      };
    });
  }

  function countryName(code) {
    if (!code) return '';
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
    } catch {
      return code;
    }
  }

  return { loadWeather };
})();
