// Line icons, 24px grid, drawn with the current text colour.
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const svg = (paths, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...P}>{paths}</svg>
);

export const Icon = {
  mic: s => svg(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>, s),
  check: s => svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, s),
  list: s => svg(<><path d="M10 6h10M10 12h10M10 18h10" /><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5L7.5 17" /></>, s),
  bag: s => svg(<><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>, s),
  note: s => svg(<><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>, s),
  search: s => svg(<><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></>, s),
  wave: s => svg(<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />, s),
  arrow: s => svg(<path d="M7 17L17 7M9 7h8v8" />, s),
  back: s => svg(<path d="M19 12H5M11 6l-6 6 6 6" />, s),
  chevron: s => svg(<path d="M7 10l5 5 5-5" />, s),
  plus: s => svg(<path d="M12 5v14M5 12h14" />, s),
  copy: s => svg(<><rect x="8" y="8" width="12" height="12" rx="2.5" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></>, s),
  calendar: s => svg(<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></>, s),
  send: s => svg(<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />, s),
  up: s => svg(<path d="M12 19V5M6 11l6-6 6 6" />, s),
  down: s => svg(<><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" /><path d="M5 19h14" /></>, s),
  trash: s => svg(<><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>, s),
  gear: s => svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>, s),
  stop: s => svg(<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />, s),
  file: s => svg(<><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>, s),
  share: s => svg(<><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" /></>, s),
  clock: s => svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>, s),
  edit: s => svg(<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />, s),
  mail: s => svg(<><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M4.5 7.5l7.5 5.5 7.5-5.5" /></>, s),
  sticky: s => svg(<><path d="M5 4h14v10l-5 6H5z" /><path d="M14 20v-6h5" /></>, s),
  pen: s => svg(<path d="M4 20l1.2-4.6L16.4 4.2a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8 4 20z" />, s),
  eye: s => svg(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>, s),
    alert: s => svg(<><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></>, s),
};

// The mark: five sound-wave bars on a coral disc (Voc = voice).
const WAVE = [[5, 9, 6], [9.5, 5, 14], [14, 2, 20], [18.5, 6, 12], [23, 9.5, 5]];
export function Logo({ size = 40 }) {
  return (
    <span className="logo" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 28 24">
        {WAVE.map(([x, y, h]) => <rect key={x} x={x - 1.6} y={y} width="3.2" height={h} rx="1.6" fill="currentColor" />)}
      </svg>
    </span>
  );
}
