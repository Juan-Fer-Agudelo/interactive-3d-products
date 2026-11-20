// Small line icons, drawn by hand so the interface needs no icon library.
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const Sound = ({ on }) => (
  <Svg>
    {[4, 9, 14, 19].map((x, i) => {
      const h = on ? [5, 9, 6, 8][i] : 1.5;
      return <path key={x} d={`M${x} ${12 - h}v${h * 2}`} />;
    })}
  </Svg>
);
export const Screen = () => <Svg><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4M9 10l2 2 4-4" /></Svg>;
export const Pad = () => <Svg><path d="M7 8h10a5 5 0 0 1 4.6 7l-.4 1a2.4 2.4 0 0 1-4.3.3L16 15H8l-.9 1.3a2.4 2.4 0 0 1-4.3-.3l-.4-1A5 5 0 0 1 7 8Z" /><path d="M8 11v2.5M6.8 12.2h2.4M16.5 12h.01" /></Svg>;
export const Sun = () => <Svg><circle cx="12" cy="12" r="3.6" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></Svg>;
export const Rain = () => <Svg><path d="M7 15a4.5 4.5 0 0 1 .6-9 5.5 5.5 0 0 1 10.4 1.6A3.8 3.8 0 0 1 17.5 15" /><path d="M9 18l-1 2.5M13 18l-1 2.5M17 18l-1 2.5" /></Svg>;
export const Person = () => <Svg><circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></Svg>;
export const Eye = () => <Svg><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></Svg>;
export const Doc = () => <Svg><path d="M7 3h7l4 4v14H7Z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></Svg>;
export const Signpost = () => <Svg><path d="M12 3v18M12 6h6l2 2-2 2h-6M12 12H6l-2 2 2 2h6" /></Svg>;
export const Leaf = () => <Svg size={16}><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14" /><path d="M5 19c3-5 6-8 10-10" /></Svg>;
export const Close = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const Arrow = () => <Svg size={15}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const Out = () => <Svg size={15}><path d="M8 16L17 7M9 7h8v8" /></Svg>;
