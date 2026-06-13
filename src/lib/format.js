export function formatDate(isoString, timezone) {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: timezone || undefined
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

export function formatTime(isoString, timezone) {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone || undefined
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

export function formatDateRange(start, end, timezone) {
  if (!start) return '';
  const startDate = formatDate(start, timezone);
  const startTime = formatTime(start, timezone);

  if (!end) return `${startDate} at ${startTime}`;

  const endDateStr = formatDate(end, timezone);
  const endTime = formatTime(end, timezone);

  if (startDate === endDateStr) {
    return `${startDate}, ${startTime} – ${endTime}`;
  }
  return `${startDate} ${startTime} – ${endDateStr} ${endTime}`;
}

export function formatShortDate(isoString, timezone) {
  if (!isoString) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: timezone || undefined
    }).format(new Date(isoString));
  } catch {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function getWeatherIcon(shortForecast) {
  if (!shortForecast) return 'Cloud';
  const f = shortForecast.toLowerCase();
  if (f.includes('thunderstorm') || f.includes('thunder')) return 'CloudLightning';
  if (f.includes('snow') || f.includes('sleet') || f.includes('ice') || f.includes('flurr')) return 'CloudSnow';
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle') || f.includes('precip')) return 'CloudRain';
  if (f.includes('fog') || f.includes('haze') || f.includes('mist')) return 'CloudFog';
  if (f.includes('wind') || f.includes('breezy') || f.includes('blustery')) return 'Wind';
  if (f.includes('cloud') || f.includes('overcast')) return 'Cloud';
  if (f.includes('partly') || f.includes('mostly cloudy')) return 'CloudSun';
  if (f.includes('sun') || f.includes('clear') || f.includes('fair') || f.includes('hot')) return 'Sun';
  return 'Cloud';
}

export function getRelevantHourly(hourlyData, eventStart, count = 8) {
  if (!hourlyData || !hourlyData.length) return [];
  if (!eventStart) return hourlyData.slice(0, count);

  const eventTime = new Date(eventStart).getTime();
  const now = Date.now();

  // Find the index closest to event start time
  let closestIdx = 0;
  let minDiff = Infinity;
  hourlyData.forEach((h, i) => {
    const diff = Math.abs(new Date(h.time).getTime() - eventTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  });

  // Start a few hours before the event
  const startIdx = Math.max(0, closestIdx - 2);
  return hourlyData.slice(startIdx, startIdx + count);
}

export function getRelevantDaily(dailyData, eventStart) {
  if (!dailyData || !dailyData.length) return dailyData || [];
  if (!eventStart) return dailyData.slice(0, 4);

  const eventDate = new Date(eventStart);
  eventDate.setHours(0, 0, 0, 0);

  const dayBefore = new Date(eventDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(eventDate);
  dayAfter.setDate(dayAfter.getDate() + 1);

  return dailyData.filter(d => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return dDate >= dayBefore && dDate <= dayAfter;
  });
}

export function isWithin48Hours(eventStart) {
  if (!eventStart) return false;
  const diff = new Date(eventStart).getTime() - Date.now();
  return diff <= 48 * 60 * 60 * 1000 && diff >= -2 * 60 * 60 * 1000;
}

// NWS /forecast covers ~7 days, /forecastHourly covers ~48 hours
export const NWS_MAX_FORECAST_DAYS = 7;

export function isBeyondForecastRange(eventStart) {
  if (!eventStart) return false;
  const diff = new Date(eventStart).getTime() - Date.now();
  return diff > NWS_MAX_FORECAST_DAYS * 24 * 60 * 60 * 1000;
}
