interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
}

/** Search icon left, clear button right — only rendered once there's text to clear. */
export function SearchBar({ value, onChange, placeholder, clearLabel }: Props) {
  return (
    <div className="searchbar">
      <svg className="searchbar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="21" y1="21" x2="16.2" y2="16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        className="searchbar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        type="search"
      />
      {value && (
        <button
          type="button"
          className="searchbar__clear"
          onClick={() => onChange('')}
          aria-label={clearLabel}
        >
          ✕
        </button>
      )}
    </div>
  );
}
