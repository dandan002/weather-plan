import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, AlertTriangle, ArrowRight } from 'lucide-react';
import styles from '../styles/CreatePage.module.css';
import WeatherPreview from '../components/WeatherPreview.jsx';
import CopyButton from '../components/CopyButton.jsx';
import { geocodeAddress, getWeather, createEvent } from '../lib/api.js';
import { NWS_MAX_FORECAST_DAYS } from '../lib/format.js';

function getMaxDatetimeLocal() {
  const max = new Date(Date.now() + NWS_MAX_FORECAST_DAYS * 24 * 60 * 60 * 1000);
  // datetime-local requires "YYYY-MM-DDTHH:MM"
  return max.toISOString().slice(0, 16);
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CreatePage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [matchedAddress, setMatchedAddress] = useState(null);
  const [coords, setCoords] = useState(null); // { lat, lon }
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');

  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [created, setCreated] = useState(null); // { id, editToken, event }

  // Auto-fetch weather when coords + eventStart are ready
  useEffect(() => {
    if (!coords || !eventStart) {
      setWeather(null);
      return;
    }
    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError('');
    getWeather(coords.lat, coords.lon, eventStart)
      .then(data => {
        if (!cancelled) {
          setWeather(data);
          setWeatherLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setWeatherError(err.message || 'Could not fetch weather');
          setWeatherLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [coords, eventStart]);

  async function handleFindLocation() {
    if (!locationQuery.trim()) return;
    setGeocoding(true);
    setGeocodeError('');
    setMatchedAddress(null);
    setCoords(null);
    try {
      const geo = await geocodeAddress(locationQuery.trim());
      setMatchedAddress(geo.matchedAddress);
      setCoords({ lat: geo.latitude, lon: geo.longitude });
    } catch (err) {
      setGeocodeError(err.message || 'Location not found. Try a more specific address.');
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setSubmitError('Title is required'); return; }
    if (!eventStart) { setSubmitError('Start date/time is required'); return; }
    if (!locationQuery.trim()) { setSubmitError('Location is required'); return; }

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        locationQuery: locationQuery.trim(),
        locationName: matchedAddress || locationQuery.trim(),
        latitude: coords?.lat,
        longitude: coords?.lon,
        eventStart: new Date(eventStart).toISOString(),
        eventEnd: eventEnd ? new Date(eventEnd).toISOString() : undefined
      };

      const result = await createEvent(payload);

      // Store edit token in sessionStorage
      sessionStorage.setItem(`editToken_${result.id}`, result.editToken);

      setCreated(result);
    } catch (err) {
      setSubmitError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setCreated(null);
    setTitle('');
    setDescription('');
    setLocationQuery('');
    setMatchedAddress(null);
    setCoords(null);
    setEventStart('');
    setEventEnd('');
    setWeather(null);
    setSubmitError('');
  }

  const showWeatherPreview = (coords || weather || weatherLoading || weatherError) && eventStart;
  const eventUrl = created ? `${window.location.origin}/e/${created.id}` : '';
  const editUrl = created ? `${window.location.origin}/e/${created.id}?edit=${created.editToken}` : '';

  if (created) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <span className={styles.logo}>WeatherPlan</span>
            <span className={styles.logoSub}>Event created</span>
          </div>
        </header>
        <main className={styles.main}>
          <h1 className={styles.heading}>Your event is ready</h1>
          <p className={styles.subheading}>Share the link below. The edit URL is only shown once — save it!</p>

          <div className={styles.successBox}>
            <div>
              <div className={styles.successTitle}>Public event link</div>
              <p className={styles.successText}>Share this with anyone — no login needed.</p>
            </div>
            <div className={styles.successLinkRow}>
              <div className={styles.successLink}>{eventUrl}</div>
              <CopyButton
                text={eventUrl}
                className={styles.findBtn}
              >
                Copy link
              </CopyButton>
            </div>

            <div className={styles.warningBox}>
              <AlertTriangle size={15} className={styles.warningIcon} />
              <div>
                <div className={styles.warningText}>
                  <strong>Save your edit URL.</strong> This is the only time it will be shown.
                  Bookmarks or saves this URL to edit or delete your event later:
                </div>
                <div className={styles.warningEditLink}>{editUrl}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a href={`/e/${created.id}`} className={styles.viewEventBtn}>
                View event <ArrowRight size={14} />
              </a>
              <button onClick={handleReset} className={styles.createAnotherBtn} type="button">
                Create another
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <span className={styles.logo}>WeatherPlan</span>
          <span className={styles.logoSub}>Weather-aware event planner</span>
        </div>
      </header>

      <main className={styles.main}>
        <h1 className={styles.heading}>Share a weather forecast</h1>
        <p className={styles.subheading}>
          Create a shareable event page with live weather forecasts. No account needed.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="title">Event title</label>
            <input
              id="title"
              className={styles.input}
              type="text"
              placeholder="e.g. Rooftop birthday party"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={120}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">Description <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              id="description"
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Any details you'd like to share…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="location">Location</label>
            <div className={styles.locationRow}>
              <input
                id="location"
                className={styles.input}
                type="text"
                placeholder="e.g. 123 Main St, Chicago, IL"
                value={locationQuery}
                onChange={e => {
                  setLocationQuery(e.target.value);
                  if (matchedAddress) {
                    setMatchedAddress(null);
                    setCoords(null);
                  }
                }}
                onBlur={() => {
                  if (locationQuery.trim() && !coords) handleFindLocation();
                }}
              />
              <button
                type="button"
                className={styles.findBtn}
                onClick={handleFindLocation}
                disabled={geocoding || !locationQuery.trim()}
              >
                {geocoding ? <span className={styles.spinner} /> : <MapPin size={14} />}
                Find
              </button>
            </div>
            {matchedAddress && (
              <div className={styles.matchedAddress}>
                <MapPin size={12} className={styles.matchedAddressIcon} />
                <span>{matchedAddress}</span>
              </div>
            )}
            {geocodeError && <div className={styles.geocodeError}>{geocodeError}</div>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Date & Time</label>
            <div className={styles.dateRow}>
              <div className={styles.field}>
                <label className={styles.hint} htmlFor="start">Start</label>
                <input
                  id="start"
                  className={styles.input}
                  type="datetime-local"
                  value={eventStart}
                  onChange={e => setEventStart(e.target.value)}
                  max={getMaxDatetimeLocal()}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.hint} htmlFor="end">End (optional)</label>
                <input
                  id="end"
                  className={styles.input}
                  type="datetime-local"
                  value={eventEnd}
                  onChange={e => setEventEnd(e.target.value)}
                  min={eventStart}
                  max={getMaxDatetimeLocal()}
                />
              </div>
            </div>
          </div>

          {showWeatherPreview && (
            <div className={styles.weatherPreviewBox}>
              <WeatherPreview
                weather={weather}
                eventStart={eventStart ? new Date(eventStart).toISOString() : null}
                loading={weatherLoading}
                error={weatherError}
              />
            </div>
          )}

          <div className={styles.submitRow}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className={`${styles.spinner}`} style={{ display: 'inline-block', marginRight: 6 }} />
                  Creating…
                </>
              ) : 'Create event'}
            </button>
            {submitError && <span className={styles.submitError}>{submitError}</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
