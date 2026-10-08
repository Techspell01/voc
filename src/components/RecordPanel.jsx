// A floating mic button, and the panel that slides up while it records.
import { Btn, Circle, Chip, COLORS } from './bits.jsx';
import { Icon } from './Icons.jsx';
import { clock, useRecorder } from '../lib/useRecorder.js';
import { MAX_SEC } from '../lib/recorder.js';

export default function RecordFab({ onAudio, disabled, tone = 'yellow', label = 'Record', what = 'note', error }) {
  const r = useRecorder(blob => onAudio(blob));
  return (
    <>
      {!r.recording && (
        <button type="button" className={`fab f-${tone}`} onClick={r.start} disabled={disabled} aria-label={label} title={label}>
          {Icon.mic(26)}
        </button>
      )}
      {r.recording && (
        <div className={`rec-panel tone t-${tone === 'yellow' ? 'yellow' : 'violet'}`} role="dialog" aria-label={`Recording a ${what}`}>
          <div className="card-top">
            <div className="grow"><Chip dot={COLORS.coral}>recording a {what} · max {MAX_SEC / 60} min</Chip></div>
            <Circle icon="plus" tone="dark" label="Cancel" onClick={r.cancel} style={{ transform: 'rotate(45deg)' }} />
          </div>
          <div className="timer" style={{ fontSize: 56 }}>{clock(r.secs)}</div>
          <div className="bars" style={{ height: 60 }} aria-hidden="true">{r.bars.map((v, i) => <span key={i} style={{ height: `${6 + v * 54}px` }} />)}</div>
          <Btn block icon="stop" onClick={r.stop}>Stop and write it</Btn>
        </div>
      )}
      {(r.error || error) && <div className="err" role="alert">{Icon.alert(18)}<span>{r.error || error}</span></div>}
    </>
  );
}
