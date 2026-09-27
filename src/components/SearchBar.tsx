import { IconClose, IconSearch } from './Icons';

export function SearchBar({ value, onChange, placeholder = 'Search a pass, town, or region' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="search" role="search">
      <IconSearch className="search__icon" />
      <input
        type="search"
        className="search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search foliage locations"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <IconClose width={18} height={18} />
        </button>
      )}
    </div>
  );
}
