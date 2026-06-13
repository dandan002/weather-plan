import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import { getWeatherIcon, getRelevantHourly, getRelevantDaily, isWithin48Hours, isBeyondForecastRange, formatTime } from '../lib/format.js';

const ICON_MAP = {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind,
  CloudSun: Cloud // fallback
};

function WeatherIcon({ forecast, size = 16 }) {
  const name = getWeatherIcon(forecast);
  const Comp = ICON_MAP[name] || Cloud;
  return <Comp size={size} />;
}

function HourlyStrip({ hourly, eventStart, timezone }) {
  const hours = getRelevantHourly(hourly, eventStart, 8);

  return (
    <div style={{ display: 'flex', gap: '0', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {hours.map((h, i) => {
        const isEventHour = eventStart && Math.abs(new Date(h.time) - new Date(eventStart)) < 3600000;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              minWidth: '52px',
              padding: '6px 4px',
              background: isEventHour ? 'var(--gray-50)' : 'transparent',
              borderRadius: '4px'
            }}
          >
            <span style={{ fontSize: '0.6875rem', color: 'var(--gray-400)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {formatTime(h.time, timezone)}
            </span>
            <div style={{ color: 'var(--gray-600)' }}>
              <WeatherIcon forecast={h.shortForecast} size={15} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              {h.temperature}°
            </span>
            {h.precipProbability != null && h.precipProbability > 0 && (
              <span style={{ fontSize: '0.625rem', color: 'var(--gray-400)' }}>
                {h.precipProbability}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DailySummary({ daily, eventStart }) {
  const days = getRelevantDaily(daily, eventStart);

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {days.map((d, i) => {
        const isEventDay = eventStart && formatDay(d.date) === formatDay(eventStart);
        return (
          <div
            key={i}
            style={{
              border: `1px solid ${isEventDay ? 'var(--black)' : 'var(--gray-200)'}`,
              borderRadius: '6px',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              minWidth: '70px',
              background: isEventDay ? 'var(--gray-50)' : 'transparent'
            }}
          >
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gray-800)' }}>
              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {d.isDaytime ? 'Day' : 'Night'}
            </span>
            <div style={{ color: 'var(--gray-600)', margin: '2px 0' }}>
              <WeatherIcon forecast={d.shortForecast} size={16} />
            </div>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
              {d.temperature}°{d.tempUnit}
            </span>
            {d.precipProbability != null && d.precipProbability > 0 && (
              <span style={{ fontSize: '0.625rem', color: 'var(--gray-400)' }}>
                {d.precipProbability}%
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatDay(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
  } catch { return ''; }
}

export default function WeatherStrip({ weatherSnapshot, eventStart }) {
  if (!weatherSnapshot) {
    return (
      <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)', padding: '0.5rem 0' }}>
        No weather data available
      </div>
    );
  }

  const { hourly, daily, timezone } = weatherSnapshot;
  const within48 = isWithin48Hours(eventStart);
  const beyondRange = isBeyondForecastRange(eventStart);

  return (
    <div>
      {beyondRange ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
          Forecast not yet available — check back closer to the date.
        </div>
      ) : within48 && hourly?.length > 0 ? (
        <HourlyStrip hourly={hourly} eventStart={eventStart} timezone={timezone} />
      ) : daily?.length > 0 ? (
        <DailySummary daily={daily} eventStart={eventStart} />
      ) : (
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-400)' }}>
          Weather data unavailable
        </div>
      )}
    </div>
  );
}
