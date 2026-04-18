/**
 * Clockwork logo — precision chronometer mark in the Obsidian Ledger theme.
 * Dark face · amber bezel · 12 tick marks · classic 10:10 hands
 */
export default function Logo({ size = 32, showText = false, textClassName = '' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clockwork"
      >
        {/* ── Face ── */}
        <circle cx="20" cy="20" r="19.5" fill="#141620" />

        {/* ── Outer bezel ring ── */}
        <circle cx="20" cy="20" r="18.5" stroke="#E8A020" strokeWidth="0.75" strokeOpacity="0.6" />

        {/* ── Inner chapter ring (depth) ── */}
        <circle cx="20" cy="20" r="16" stroke="#E8A020" strokeWidth="0.4" strokeOpacity="0.2" />

        {/* ── Major tick marks: 12 / 3 / 6 / 9 ── */}
        {/* 12 */}
        <line x1="20"   y1="2.5"  x2="20"   y2="7"    stroke="#E8A020" strokeWidth="2"   strokeLinecap="round" />
        {/* 3 */}
        <line x1="37.5" y1="20"   x2="33"   y2="20"   stroke="#E8A020" strokeWidth="2"   strokeLinecap="round" />
        {/* 6 */}
        <line x1="20"   y1="37.5" x2="20"   y2="33"   stroke="#E8A020" strokeWidth="2"   strokeLinecap="round" />
        {/* 9 */}
        <line x1="2.5"  y1="20"   x2="7"    y2="20"   stroke="#E8A020" strokeWidth="2"   strokeLinecap="round" />

        {/* ── Minor tick marks ── */}
        {/* 1 o'clock  — angle 30° clock / -60° math */}
        <line x1="28.75" y1="4.84"  x2="27.75" y2="6.58"  stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 2 o'clock  — angle 60° clock / -30° math */}
        <line x1="35.16" y1="11.25" x2="33.42" y2="12.25" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 4 o'clock  — angle 120° clock / 30° math */}
        <line x1="35.16" y1="28.75" x2="33.42" y2="27.75" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 5 o'clock  — angle 150° clock / 60° math */}
        <line x1="28.75" y1="35.16" x2="27.75" y2="33.42" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 7 o'clock  — angle 210° clock / 120° math */}
        <line x1="11.25" y1="35.16" x2="12.25" y2="33.42" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 8 o'clock  — angle 240° clock / 150° math */}
        <line x1="4.84"  y1="28.75" x2="6.58"  y2="27.75" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 10 o'clock — angle 300° clock / 210° math */}
        <line x1="4.84"  y1="11.25" x2="6.58"  y2="12.25" stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
        {/* 11 o'clock — angle 330° clock / 240° math */}
        <line x1="11.25" y1="4.84"  x2="12.25" y2="6.58"  stroke="#E8A020" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />

        {/* ── Hour hand — 10 o'clock ── */}
        {/* math angle 210°: tip = (20 - 11·cos30°, 20 - 11·sin30°·2) = (10.5, 14.5) */}
        <line x1="20" y1="20" x2="10.5" y2="14.5" stroke="#E8A020" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── Minute hand — 2 o'clock (10 min) ── */}
        {/* math angle -30°: tip = (20 + 14·cos30°, 20 - 14·sin30°·2) = (32.1, 13) */}
        <line x1="20" y1="20" x2="32"   y2="13"   stroke="#E8A020" strokeWidth="1.5" strokeLinecap="round" />

        {/* ── Center hub ── */}
        <circle cx="20" cy="20" r="2.5" fill="#E8A020" />
        <circle cx="20" cy="20" r="1.2" fill="#141620" />
      </svg>

      {showText && (
        <span className={textClassName}>Clockwork</span>
      )}
    </span>
  )
}
