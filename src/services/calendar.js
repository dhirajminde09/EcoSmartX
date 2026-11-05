/**
 * Google Calendar API Service for EcoSmartX
 * Uses client-side OAuth Bearer token from Firebase Auth
 */
import { getCachedAccessToken } from './firebase.js';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Fetch events from user's primary Google Calendar
 */
export async function getCalendarEvents(options = {}) {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to access Google Calendar.');
  }

  const now = new Date();
  const defaultMin = new Date(now.getTime() - 7 * 86400000).toISOString();
  const defaultMax = new Date(now.getTime() + 30 * 86400000).toISOString();

  const timeMin = options.timeMin || defaultMin;
  const timeMax = options.timeMax || defaultMax;

  const url = new URL(`${CALENDAR_API_BASE}/calendars/primary/events`);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '50');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Calendar API error: ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Create an Energy Event in Google Calendar
 */
export async function createCalendarEnergyEvent({ title, description, startTime, endTime, eventType }) {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google to schedule events on Google Calendar.');
  }

  // Color mapping: 11 = Red (Demand Response/Peak), 2 = Green (Solar/Audit), 5 = Yellow (Maintenance)
  let colorId = '2'; // Sage/Green default
  if (eventType === 'demand_response' || eventType === 'peak_shaving') {
    colorId = '11'; // Flamingo/Red
  } else if (eventType === 'maintenance') {
    colorId = '5'; // Banana/Yellow
  } else if (eventType === 'energy_audit') {
    colorId = '9'; // Blueberry/Blue
  }

  const payload = {
    summary: `[EcoSmartX] ${title}`,
    description: `${description}\n\nManaged automatically via EcoSmartX Energy Optimization Platform.`,
    start: {
      dateTime: new Date(startTime).toISOString(),
    },
    end: {
      dateTime: new Date(endTime).toISOString(),
    },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Calendar event: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Delete a Calendar event with strict user confirmation
 */
export async function removeCalendarEvent(eventId, eventTitle = 'this event') {
  const token = getCachedAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED: Please sign in with Google.');
  }

  // Mandatory confirmation required by Google Workspace integration rules
  const confirmed = window.confirm(
    `Are you sure you want to delete "${eventTitle}" from your Google Calendar? This action cannot be undone.`
  );
  if (!confirmed) {
    return false;
  }

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to remove event: ${res.statusText}`);
  }

  return true;
}
