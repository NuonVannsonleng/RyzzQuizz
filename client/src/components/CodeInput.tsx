import { useState, type CSSProperties } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { spring } from '../lib/motion.js';

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  length: number;
}

/**
 * A real text input drives capture, paste, and a11y; the boxes on top are a
 * pure display layer so each digit can pop in on its own instead of the
 * whole field re-rendering flat.
 */
export function CodeInput({ id, value, onChange, length }: Props) {
  const [focused, setFocused] = useState(false);
  const chars = value.padEnd(length, ' ').slice(0, length).split('');

  return (
    <div
      className="codeinput"
      style={{ '--code-len': length } as CSSProperties}
    >
      <input
        id={id}
        className="codeinput__field"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={length}
        autoComplete="off"
        autoCapitalize="characters"
        inputMode="text"
        aria-label="Room code"
        required
      />
      <div className="codeinput__boxes" aria-hidden="true">
        {chars.map((ch, i) => {
          const filled = ch.trim().length > 0;
          const active = focused && i === value.length;
          return (
            <div
              key={i}
              className={`codeinput__box ${filled ? 'is-filled' : ''} ${active ? 'is-active' : ''}`}
            >
              <AnimatePresence>
                {filled && (
                  <m.span
                    key={ch}
                    className="codeinput__char"
                    initial={{ scale: 0.3, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.3, opacity: 0 }}
                    transition={spring.pop}
                  >
                    {ch}
                  </m.span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
