import { Icon } from './Icons.jsx';

export function BusyBars() {
  return <span className="busy-bars" aria-hidden="true"><span /><span /><span /></span>;
}

// Round icon button: <Circle icon="arrow" label="Open" tone="dark" />
export function Circle({ icon, label, tone = '', size = 20, small, href, ...props }) {
  const cls = `circle${small ? ' sm' : ''}${tone ? ` ${tone}` : ''}`;
  if (href) return <a className={cls} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} {...props}>{Icon[icon](size)}</a>;
  return <button type="button" className={cls} aria-label={label} title={label} {...props}>{Icon[icon](size)}</button>;
}

export function Btn({ children, icon, tone = '', block, href, ...props }) {
  const cls = `btn${tone ? ` ${tone}` : ''}${block ? ' block' : ''}`;
  const inner = <>{icon && Icon[icon](18)}{children}</>;
  if (href) return <a className={cls} href={href} target="_blank" rel="noreferrer" {...props}>{inner}</a>;
  return <button type="button" className={cls} {...props}>{inner}</button>;
}

// White pill with a dark chevron disc, like a select.
export function Pill({ children, onClick, icon = 'chevron', wide, label }) {
  return (
    <button type="button" className={`pill${wide ? ' wide' : ''}`} onClick={onClick} aria-label={label}>
      <span className="label">{children}</span><span className="chev">{Icon[icon](16)}</span>
    </button>
  );
}

export function Chip({ dot, children }) {
  return <span className="chip">{dot && <span className="dot" style={{ background: dot }} />}{children}</span>;
}

export function Check({ checked, onChange, label }) {
  return (
    <button type="button" className={`check${checked ? ' on' : ''}`} role="checkbox" aria-checked={checked} aria-label={label} onClick={onChange}>
      {Icon.check(16)}
    </button>
  );
}

export function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([id, text]) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)}>{text}</button>
      ))}
    </div>
  );
}

export function ScreenHead({ title, onBack, right }) {
  return (
    <div className="screen-head">
      {onBack && <Circle icon="back" label="Back" onClick={onBack} />}
      <h1 className="title">{title}</h1>
      {right}
    </div>
  );
}

export const COLORS = { coral: '#F2705F', violet: '#8489F2', yellow: '#F4C44D', ice: '#BEE7EE', mint: '#A9DCC6', ink: '#161616' };

// A native <select> dressed as a white pill, so phones show their own picker.
export function SelectPill({ value, options, onChange, label }) {
  return (
    <label className="pill select-pill">
      <span className="label">{options.find(o => o[0] === value)?.[1]}</span>
      <span className="chev">{Icon.chevron(16)}</span>
      <select value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
        {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
      </select>
    </label>
  );
}
