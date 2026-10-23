// Getting actions out of Voc: WhatsApp text for orders, calendar entries for events.
import { qtyText, whenText } from './format.js';

export function orderText(items, order, today) {
  const lines = items.map((it, n) => `${n + 1}. ${it.name}${qtyText(it.qty, it.unit) ? ` - ${qtyText(it.qty, it.unit)}` : ''}`);
  const when = order ? whenText(order, today) : '';
  return [`*Order* (${items.length} item${items.length === 1 ? '' : 's'})`, ...lines, when ? `\nDeliver: ${when}` : ''].filter(Boolean).join('\n');
}

export const whatsappUrl = text => `https://wa.me/?text=${encodeURIComponent(text)}`;

const pad = n => String(n).padStart(2, '0');
const compact = (date, time) => date.replace(/-/g, '') + (time ? `T${time.replace(':', '')}00` : '');
const nextDay = date => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};
const plusHour = time => `${pad((+time.slice(0, 2) + 1) % 24)}:${time.slice(3)}`;

// Google Calendar's "add event" page, in Kerala time.
export function googleCalendarUrl(ev) {
  const dates = ev.time
    ? `${compact(ev.date, ev.time)}/${compact(ev.date, plusHour(ev.time))}`
    : `${compact(ev.date)}/${compact(nextDay(ev.date))}`;
  const q = new URLSearchParams({ action: 'TEMPLATE', text: ev.title, dates, ctz: 'Asia/Kolkata', details: ev.said ? `"${ev.said}" (from Voc)` : 'From Voc' });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
