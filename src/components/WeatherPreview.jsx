import React from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind } from 'lucide-react';
import styles from '../styles/WeatherPreview.module.css';
import { getWeatherIcon, getRelevantHourly, getRelevantDaily, isWithin48Hours, isBeyondForecastRange, formatTime } from '../lib/format.js';

const ICON_MAP = { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, CloudSun: Cloud };

function WeatherIcon({ forecast, size = 16 }) {
  const name = getWeatherIcon(forecast);
  const Comp = ICON_MAP[name] || Cloud;
  return <Comp size={size} />;
}

function HourlyView({ hourly, eventStart, timezone }) {
  const hours = getRelevantHourly(hourly, eventStart, 8);

  return (
    <div className={styles.hourlyStrip}>
      {hours.map((h, i) => {
        const isEvent = eventStart && Math.abs(new Date(h.time) - new Date(eventStart)) < 3600000 * 2;
        return (
          <div key={i} className={`${styles.hourSlot} ${isEvent ? styles.isEvent : ''}`}>
            <span className={styles.hourTime}>{formatTime(h.time, timezone)}</span>
            <div className={styles.hourIcon}>
              <WeatherIcon forecast={h.shortForecast} size={15} />
            </div>
            <span className={styles.hourTemp}>{h.temperature}°</span>
            {(h.precipProbability ?? 0) > 0 && (
              <span className={styles.precipPct}>{h.precipProbability}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DailyView({ daily, eventStart }) {
  const days = getRelevantDaily(daily, eventStart);

  function isSameDay(iso1, iso2) {
    if (!iso1 || !iso2) return false;
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  return (
    <div className={styles.dailyGrid}>
      {days.map((d, i) => {
        const isEvent = isSameDay(d.date, eventStart);
        return (
          <div key={i} className={`${styles.dayCard} ${isEvent ? styles.isEvent : ''}`}>
            <span className={styles.dayName}>
              {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span className={styles.dayPeriod}>{d.isDaytime ? 'Day' : 'Night'}</span>
            <div className={styles.dayIcon}>
              <WeatherIcon forecast={d.shortForecast} size={18} />
            </div>
            <span className={styles.dayTemp}>{d.temperature}°{d.tempUnit}</span>
            {(d.precipProbability ?? 0) > 0 && (
              <span className={styles.dayPrecip}>{d.precipProbability}% precip</span>
            )}
            <span className={styles.dayForecast}>{d.shortForecast}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function WeatherPreview({ weather, eventStart, loading, error }) {
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.heading}>Weather Forecast</div>
        <div className={styles.fetchingBox}>
          <div className={styles.spinner} />
          <span>Fetching forecast…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.heading}>Weather Forecast</div>
        <div className={styles.errorMsg}>{error}</div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const { hourly, daily, timezone } = weather;
  const within48 = isWithin48Hours(eventStart);
  const beyondRange = isBeyondForecastRange(eventStart);

  return (
    <div className={styles.container}>
      <div className={styles.heading}>
        Weather Forecast
        {timezone && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4, color: 'var(--gray-400)' }}>· {timezone}</span>}
      </div>

      {beyondRange ? (
        <div className={styles.noWeather}>Forecast not yet available — check back closer to the date.</div>
      ) : within48 && hourly?.length > 0 ? (
        <HourlyView hourly={hourly} eventStart={eventStart} timezone={timezone} />
      ) : daily?.length > 0 ? (
        <DailyView daily={daily} eventStart={eventStart} />
      ) : (
        <div className={styles.noWeather}>No forecast data available</div>
      )}
    </div>
  );
}
