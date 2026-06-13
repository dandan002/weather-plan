const BASE = '/api';

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function geocodeAddress(query) {
  const res = await fetch(`${BASE}/geocode?query=${encodeURIComponent(query)}`);
  return handleResponse(res);
}

export async function getWeather(lat, lon, eventStart) {
  const params = new URLSearchParams({ lat, lon });
  if (eventStart) params.set('eventStart', eventStart);
  const res = await fetch(`${BASE}/weather?${params}`);
  return handleResponse(res);
}

export async function createEvent(data) {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function getEvent(id) {
  const res = await fetch(`${BASE}/events/${id}`);
  return handleResponse(res);
}

export async function updateEvent(id, editToken, data) {
  const res = await fetch(`${BASE}/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-edit-token': editToken
    },
    body: JSON.stringify({ ...data, editToken })
  });
  return handleResponse(res);
}

export async function deleteEvent(id, editToken) {
  const res = await fetch(`${BASE}/events/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-edit-token': editToken
    },
    body: JSON.stringify({ editToken })
  });
  return handleResponse(res);
}
