const FLAG_CLASSES = ['o0', 'o1', 'o2', 'o3', 'accent'];

/**
 * Decorative Kahoot-style party-room backdrop — bunting flags across the top,
 * two soft colour glows, and a handful of drifting shapes. Pure CSS/SVG, no
 * image assets. `aria-hidden` + `pointer-events: none` throughout — it never
 * competes with real content or intercepts clicks.
 */
export function PartyBackground() {
  return (
    <div className="party-bg" aria-hidden="true">
      <svg className="party-bg__bunting" viewBox="0 0 1000 70" preserveAspectRatio="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <polygon
            key={i}
            className={`party-bg__flag party-bg__flag--${FLAG_CLASSES[i % FLAG_CLASSES.length]}`}
            points={`${i * 50},0 ${i * 50 + 25},62 ${i * 50 + 50},0`}
          />
        ))}
      </svg>
      <span className="party-bg__glow party-bg__glow--1" />
      <span className="party-bg__glow party-bg__glow--2" />
      <span className="party-bg__shape party-bg__shape--0" />
      <span className="party-bg__shape party-bg__shape--1" />
      <span className="party-bg__shape party-bg__shape--2" />
      <span className="party-bg__shape party-bg__shape--3" />
      <span className="party-bg__shape party-bg__shape--4" />
    </div>
  );
}
