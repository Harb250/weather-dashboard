const { renderWeather } = (() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    result: $('result'),
    city: $('city-name'),
    country: $('country'),
    localTime: $('local-time'),
    icon: $('current-icon'),
    temp: $('temp'),
    description: $('description'),
    feelsLike: $('feels-like'),
    humidity: $('humidity'),
    wind: $('wind'),
    highLow: $('high-low'),
    forecast: $('forecast'),
    source: $('source'),
  };

  const iconUrl = (code) => `https://openweathermap.org/img/wn/${code}@2x.png`;
  const deg = (n) => `${Math.round(n)}°`;

  const timeFmt = new Intl.DateTimeFormat('en', {
    weekday: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
  const dayFmt = new Intl.DateTimeFormat('en', { weekday: 'short', timeZone: 'UTC' });

  function renderWeather({ place, current, daily, source }) {
    els.city.textContent = place.name;
    els.country.textContent = place.country;
    els.localTime.textContent = `Local time · ${timeFmt.format(current.localTime)}`;

    els.icon.src = iconUrl(current.icon);
    els.icon.alt = current.description;
    els.temp.textContent = deg(current.temp);
    els.description.textContent = current.description;

    els.feelsLike.textContent = deg(current.feelsLike);
    els.humidity.textContent = `${Math.round(current.humidity)}%`;
    els.wind.textContent = `${Math.round(current.windKmh)} km/h`;
    const today = daily[0];
    els.highLow.textContent = today ? `${deg(today.max)} / ${deg(today.min)}` : '—';

    els.forecast.replaceChildren(...daily.map(renderDay));
    els.source.textContent = source;
    els.result.hidden = false;
  }

  function renderDay(day, i) {
    const li = document.createElement('li');
    li.className = 'day';

    const name = document.createElement('span');
    name.className = 'day__name';
    name.textContent = i === 0 ? 'Today' : dayFmt.format(day.date);

    const img = document.createElement('img');
    img.className = 'day__icon';
    img.src = iconUrl(day.icon);
    img.alt = day.description;
    img.width = 56;
    img.height = 56;

    const temps = document.createElement('span');
    temps.className = 'day__temps';
    const max = document.createElement('strong');
    max.textContent = deg(day.max);
    const min = document.createElement('span');
    min.textContent = deg(day.min);
    temps.append(max, min);

    li.append(name, img, temps);
    return li;
  }

  return { renderWeather };
})();
