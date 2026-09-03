/**
 * Decorative backdrop — a soft drifting aurora band, two colour glows, and a
 * handful of floating shapes. Pure CSS, no image assets. `aria-hidden` +
 * `pointer-events: none` throughout — it never competes with real content or
 * intercepts clicks.
 */
export function PartyBackground() {
  return (
    <div className="party-bg" aria-hidden="true">
      <span className="party-bg__aurora" />
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
