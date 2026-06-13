import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Download, Edit2, Trash2, X, MapPin, ArrowLeft } from 'lucide-react';
import { toPng } from 'html-to-image';
import styles from '../styles/EventPage.module.css';
import EventCard from '../components/EventCard.jsx';
import CopyButton from '../components/CopyButton.jsx';
import { getEvent, updateEvent, deleteEvent, geocodeAddress } from '../lib/api.js';

export default function EventPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editToken, setEditToken] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const cardRef = useRef(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMatchedAddress, setEditMatchedAddress] = useState('');
  const [editCoords, setEditCoords] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editGeocoding, setEditGeocoding] = useState(false);
  const [editGeocodeError, setEditGeocodeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    // Resolve editToken: router state > sessionStorage > query param
    let token = location.state?.editToken || null;
    if (!token) token = sessionStorage.getItem(`editToken_${id}`) || null;
    if (!token) {
      const params = new URLSearchParams(location.search);
      token = params.get('edit') || null;
    }
    if (token) {
      setEditToken(token);
      sessionStorage.setItem(`editToken_${id}`, token);
    }

    loadEvent();
  }, [id]);

  async function loadEvent() {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvent(id);
      setEvent(data);
    } catch (err) {
      setError(err.message || 'Event not found');
    } finally {
      setLoading(false);
    }
  }

  function openEdit() {
    if (!event) return;
    setEditTitle(event.title || '');
    setEditDescription(event.description || '');
    setEditLocation(event.locationName || '');
    setEditMatchedAddress('');
    setEditCoords(null);
    setEditStart(toLocalDatetimeInput(event.eventStart));
    setEditEnd(event.eventEnd ? toLocalDatetimeInput(event.eventEnd) : '');
    setSaveError('');
    setEditing(true);
  }

  function toLocalDatetimeInput(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const pad = n => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch { return ''; }
  }

  async function handleFindEditLocation() {
    if (!editLocation.trim()) return;
    setEditGeocoding(true);
    setEditGeocodeError('');
    setEditMatchedAddress('');
    setEditCoords(null);
    try {
      const geo = await geocodeAddress(editLocation.trim());
      setEditMatchedAddress(geo.matchedAddress);
      setEditCoords({ lat: geo.latitude, lon: geo.longitude });
    } catch (err) {
      setEditGeocodeError(err.message || 'Location not found');
    } finally {
      setEditGeocoding(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!editTitle.trim()) { setSaveError('Title is required'); return; }
    if (!editStart) { setSaveError('Start date/time is required'); return; }

    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        locationName: editMatchedAddress || editLocation.trim() || event.locationName,
        latitude: editCoords?.lat || event.latitude,
        longitude: editCoords?.lon || event.longitude,
        eventStart: new Date(editStart).toISOString(),
        eventEnd: editEnd ? new Date(editEnd).toISOString() : null
      };

      const updated = await updateEvent(id, editToken, payload);
      setEvent(updated);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEvent(id, editToken);
      sessionStorage.removeItem(`editToken_${id}`);
      navigate('/', { replace: true });
    } catch (err) {
      setConfirmDelete(false);
      setDeleting(false);
      alert(err.message || 'Failed to delete event');
    }
  }

  async function handleExport() {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#fff'
      });
      const link = document.createElement('a');
      link.download = `${event?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'event'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert('Failed to export image: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  const eventUrl = `${window.location.origin}/e/${id}`;

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <Link to="/" className={styles.backLink}><ArrowLeft size={14} /> WeatherPlan</Link>
            </div>
          </div>
        </header>
        <div className={styles.main}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <span>Loading event…</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <Link to="/" className={styles.backLink}><ArrowLeft size={14} /> WeatherPlan</Link>
            </div>
          </div>
        </header>
        <div className={styles.main}>
          <div className={styles.errorBox}>
            <div className={styles.errorTitle}>Event not found</div>
            <p className={styles.errorText}>
              This event may have expired or been deleted.
            </p>
            <Link to="/" className={styles.errorLink}>
              Create a new event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <Link to="/" className={styles.backLink}><ArrowLeft size={14} /> WeatherPlan</Link>
          </div>
          <div className={styles.actions}>
            <CopyButton
              text={eventUrl}
              className={styles.actionBtn}
            >
              Copy link
            </CopyButton>

            <button
              className={styles.actionBtn}
              onClick={handleExport}
              disabled={exporting}
              title="Download as PNG"
            >
              <Download size={13} />
              {exporting ? 'Exporting…' : 'Save PNG'}
            </button>

            {editToken && !editing && (
              <button
                className={styles.actionBtn}
                onClick={openEdit}
                title="Edit event"
              >
                <Edit2 size={13} />
                Edit
              </button>
            )}

            {editToken && !editing && (
              <button
                className={`${styles.actionBtn} ${styles.dangerBtn}`}
                onClick={() => setConfirmDelete(true)}
                title="Delete event"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}

            {editing && (
              <button
                className={styles.actionBtn}
                onClick={() => { setEditing(false); setSaveError(''); }}
              >
                <X size={13} />
                Cancel
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {saveSuccess && (
          <div className={styles.successNotice}>
            ✓ Event updated successfully
          </div>
        )}

        {confirmDelete && (
          <div className={styles.confirmBox}>
            <span className={styles.confirmText}>Delete this event permanently?</span>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmDeleteBtn}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                className={styles.confirmCancelBtn}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {editing ? (
          <div className={styles.editSection}>
            <div className={styles.editTitle}>Edit Event</div>
            <form onSubmit={handleSave} className={styles.editForm}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  className={styles.input}
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-desc">Description</label>
                <textarea
                  id="edit-desc"
                  className={`${styles.input} ${styles.textarea}`}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-location">Location</label>
                <div className={styles.locationRow}>
                  <input
                    id="edit-location"
                    className={styles.input}
                    type="text"
                    value={editLocation}
                    onChange={e => {
                      setEditLocation(e.target.value);
                      setEditMatchedAddress('');
                      setEditCoords(null);
                    }}
                  />
                  <button
                    type="button"
                    className={styles.findBtn}
                    onClick={handleFindEditLocation}
                    disabled={editGeocoding || !editLocation.trim()}
                  >
                    {editGeocoding ? '…' : <MapPin size={14} />}
                    Find
                  </button>
                </div>
                {editMatchedAddress && (
                  <div className={styles.matchedAddress}>
                    <MapPin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{editMatchedAddress}</span>
                  </div>
                )}
                {editGeocodeError && (
                  <div style={{ fontSize: '0.8125rem', color: '#c00', marginTop: '0.25rem' }}>
                    {editGeocodeError}
                  </div>
                )}
              </div>

              <div className={styles.dateRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-start">Start</label>
                  <input
                    id="edit-start"
                    className={styles.input}
                    type="datetime-local"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="edit-end">End (optional)</label>
                  <input
                    id="edit-end"
                    className={styles.input}
                    type="datetime-local"
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                    min={editStart}
                  />
                </div>
              </div>

              <div className={styles.editActions}>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => { setEditing(false); setSaveError(''); }}
                >
                  Cancel
                </button>
                {saveError && <span className={styles.editError}>{saveError}</span>}
              </div>
            </form>
          </div>
        ) : (
          <EventCard ref={cardRef} event={event} />
        )}
      </main>
    </div>
  );
}
