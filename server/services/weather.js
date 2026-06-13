const NWS_BASE = 'https://api.weather.gov';

async function nwsFetch(url) {
  const userAgent = process.env.NWS_USER_AGENT || 'WeatherEventPlanner (contact@example.com)';
  const res = await fetch(url, {
    headers: { 'User-Agent': userAgent, 'Accept': 'application/geo+json' }
  });
  if (!res.ok) throw new Error(`NWS error ${res.status}: ${url}`);
  return res.json();
}

async function getWeatherForLocation(lat, lon) {
  // Round to 4 decimal places for NWS
  const pointData = await nwsFetch(`${NWS_BASE}/points/${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`);
  const props = pointData.properties;
  const timezone = props.timeZone;
  const gridInfo = { gridId: props.gridId, gridX: props.gridX, gridY: props.gridY };

  const [hourlyData, dailyData] = await Promise.all([
    nwsFetch(props.forecastHourly),
    nwsFetch(props.forecast)
  ]);

  const hourly = hourlyData.properties.periods.slice(0, 48).map(p => ({
    time: p.startTime,
    temperature: p.temperature,
    tempUnit: p.temperatureUnit,
    precipProbability: p.probabilityOfPrecipitation?.value ?? 0,
    cloudCover: p.skyCover?.value ?? null,
    windSpeed: p.windSpeed,
    windDirection: p.windDirection,
    shortForecast: p.shortForecast,
    humidity: p.relativeHumidity?.value ?? null,
    dewpoint: p.dewpoint?.value ?? null
  }));

  const daily = dailyData.properties.periods.slice(0, 28).map(p => ({
    date: p.startTime,
    name: p.name,
    temperature: p.temperature,
    tempUnit: p.temperatureUnit,
    isDaytime: p.isDaytime,
    precipProbability: p.probabilityOfPrecipitation?.value ?? 0,
    shortForecast: p.shortForecast,
    icon: p.icon,
    windSpeed: p.windSpeed,
    windDirection: p.windDirection
  }));

  return { timezone, gridInfo, hourly, daily, fetchedAt: new Date().toISOString() };
}

module.exports = { getWeatherForLocation };
