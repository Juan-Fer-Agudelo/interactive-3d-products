import { useEffect, useState } from 'react';
import { useStore } from '../store';

// The sky is already on screen while the meadow is built behind it; the bar
// reports the real steps (typeface, ground, physics, first frames).
export default function Loader() {
  const phase = useStore((s) => s.phase);
  const progress = useStore((s) => s.progress);
  const phrase = useStore((s) => s.phrase);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (phase === 'loading') return;
    const t = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(t);
  }, [phase]);

  if (gone) return null;
  const pct = Math.round(progress * 100);
  return (
    <div className={'loader' + (phase !== 'loading' ? ' loader--out' : '')} role="status" aria-live="polite">
      <div className="loader__sky" />
      <div className="loader__box">
        <div className="loader__row">
          <span>{phrase}</span>
          <span>{pct}%</span>
        </div>
        <div className="loader__track">
          <div className="loader__fill" style={{ width: pct + '%' }}>
            <i /><i /><i />
          </div>
        </div>
      </div>
    </div>
  );
}
