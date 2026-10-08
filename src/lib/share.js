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

// IST -> UTC for .ics (no time-zone block needed).
function utcStamp(date, time) {
  const d = new Date(`${date}T${time}:00+05:30`);
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
const esc = s => String(s ?? '').replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');

// One .ics for any calendar app, with a reminder 30 minutes before (or 9 am for all-day).
export function icsFile(entries) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const body = entries.map((ev, n) => {
    const timed = !!ev.time;
    return [
      'BEGIN:VEVENT',
      `UID:${now}-${n}@voc`,
      `DTSTAMP:${now}`,
      timed ? `DTSTART:${utcStamp(ev.date, ev.time)}` : `DTSTART;VALUE=DATE:${compact(ev.date)}`,
      timed ? `DTEND:${utcStamp(ev.date, plusHour(ev.time))}` : `DTEND;VALUE=DATE:${compact(nextDay(ev.date))}`,
      `SUMMARY:${esc(ev.title)}`,
      ev.said ? `DESCRIPTION:${esc(`"${ev.said}" (from Voc)`)}` : '',
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(ev.title)}`, timed ? 'TRIGGER:-PT30M' : 'TRIGGER:PT9H', 'END:VALARM',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Voc//EN', 'CALSCALE:GREGORIAN', ...body, 'END:VCALENDAR'].join('\r\n');
}

export function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
