/**
 * Clockwork logo — a clean clock face in brand sky-blue.
 * Use `size` for width/height, `textSize` to show/hide the wordmark.
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
        {/* Outer ring */}
        <circle cx="20" cy="20" r="19" fill="#0ea5e9" />

        {/* Subtle inner glow */}
        <circle cx="20" cy="20" r="15" fill="white" fillOpacity="0.12" />

        {/* Tick marks at 12, 3, 6, 9 */}
        <line x1="20" y1="4"  x2="20" y2="8"  stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
        <line x1="36" y1="20" x2="32" y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
        <line x1="20" y1="36" x2="20" y2="32" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />
        <line x1="4"  y1="20" x2="8"  y2="20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.5" />

        {/* Hour hand — pointing ~10 o'clock */}
        <line x1="20" y1="20" x2="12" y2="12" stroke="white" strokeWidth="3" strokeLinecap="round" />

        {/* Minute hand — pointing ~2 o'clock */}
        <line x1="20" y1="20" x2="27" y2="11" stroke="white" strokeWidth="2" strokeLinecap="round" />

        {/* Center cap */}
        <circle cx="20" cy="20" r="2.5" fill="white" />
      </svg>

      {showText && (
        <span className={textClassName}>Clockwork</span>
      )}
    </span>
  )
}
