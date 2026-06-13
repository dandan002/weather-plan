import React, { forwardRef } from 'react';
import { Calendar, MapPin, Clock } from 'lucide-react';
import styles from '../styles/EventCard.module.css';
import WeatherStrip from './WeatherStrip.jsx';
import { formatDateRange, formatDate, formatTime } from '../lib/format.js';

const EventCard = forwardRef(function EventCard({ event }, ref) {
  if (!event) return null;

  const {
    title,
    description,
    locationName,
    eventStart,
    eventEnd,
    timezone,
    weatherSnapshot,
    weatherFetchedAt,
    expiresAt
  } = event;

  function formatFetchedAt(iso) {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date(iso));
    } catch { return null; }
  }

  function formatExpiry(iso) {
    if (!iso) return null;
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(iso));
    } catch { return null; }
  }

  return (
    <div className={styles.card} ref={ref}>
      <div className={styles.cardInner}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {description && (
            <p className={styles.description}>{description}</p>
          )}
        </div>

        <div className={styles.metaList}>
          <div className={styles.metaItem}>
            <Calendar size={15} className={styles.metaIcon} />
            <div>
              <div className={styles.metaLabel}>Date & Time</div>
              <div className={styles.metaText}>{formatDateRange(eventStart, eventEnd, timezone)}</div>
            </div>
          </div>

          <div className={styles.metaItem}>
            <MapPin size={15} className={styles.metaIcon} />
            <div>
              <div className={styles.metaLabel}>Location</div>
              <div className={styles.metaText}>{locationName}</div>
            </div>
          </div>
        </div>

        {weatherSnapshot && (
          <>
            <hr className={styles.divider} />
            <div className={styles.weatherSection}>
              <div className={styles.weatherHeading}>Forecast</div>
              <WeatherStrip weatherSnapshot={weatherSnapshot} eventStart={eventStart} />
            </div>
          </>
        )}
      </div>

      <div className={styles.footer}>
        <div>
          {weatherFetchedAt && (
            <div className={styles.footerNote}>
              Forecast as of {formatFetchedAt(weatherFetchedAt)}
            </div>
          )}
          {expiresAt && (
            <div className={styles.footerNote}>
              Link valid until {formatExpiry(expiresAt)}
            </div>
          )}
        </div>
        <div className={styles.brand}>WeatherPlan</div>
      </div>
    </div>
  );
});

export default EventCard;
