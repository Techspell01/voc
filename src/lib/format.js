// Display helpers. Quantities the way a Kerala shop says them: ½ kg, ₹100 worth.
import { addDays } from './manglish/when.js';

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾' };

export function number(q) {
  const whole = Math.floor(q);
  const frac = +(q - whole).toFixed(2);
  if (FRACTIONS[frac]) return `${whole || ''}${FRACTIONS[frac]}`;
  return String(+q.toFixed(3));
}

const PLURAL = { packet: 'packets', bottle: 'bottles', bundle: 'bundles', box: 'boxes', tin: 'tins', bag: 'bags', tray: 'trays', load: 'loads' };
const SHORT = { kg: 'kg', g: 'g', l: 'L', ml: 'ml', dozen: 'dozen' };

export function qtyText(qty, unit) {
  if (qty == null) return unit && unit !== '₹' ? (SHORT[unit] ?? unit) : '';
  if (unit === '₹') return `₹${number(qty)} worth`;
  const n = number(qty);
  if (!unit || unit === 'piece') return n;
  if (SHORT[unit]) return `${n} ${SHORT[unit]}`;
  return `${n} ${qty > 1 ? PLURAL[unit] ?? unit : unit}`;
}

export function dayText(date, today) {
  if (!date) return '';
  if (date === today) return 'today';
  if (date === addDays(today, 1)) return 'tomorrow';
  if (date === addDays(today, -1)) return 'yesterday';
  const d = new Date(`${date}T00:00:00Z`);
  const s = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  return date.slice(0, 4) === today.slice(0, 4) ? s : `${s} ${date.slice(0, 4)}`;
}

const PART = { '05:30': 'early morning', '09:00': 'morning', '12:00': 'noon', '13:00': 'afternoon', '15:00': 'afternoon', '17:00': 'evening', '20:00': 'night' };

export function timeText(time, approx) {
  if (!time) return '';
  if (approx && PART[time]) return PART[time];
  const [h, m] = time.split(':').map(Number);
  const hh = h % 12 || 12;
  return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

export function whenText(x, today) {
  if (!x) return '';
  return [dayText(x.date, today), timeText(x.time, x.approx)].filter(Boolean).join(', ');
}

export function ago(iso, now = Date.now()) {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
