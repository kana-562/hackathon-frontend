import { useState, KeyboardEvent } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string, smart?: boolean) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, onSubmit, placeholder }: Props) {
  const [focused, setFocused] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onSubmit(value.trim(), false);
    }
  };

  const handleSparkleClick = () => {
    if (value.trim()) {
      onSubmit(value.trim(), true);
    }
  };

  return (
    <div className="search-bar" style={{ opacity: focused ? 1 : 0.95 }}>
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder ?? 'キーワードで探す、または何でも聞く'}
      />
      <span
        className="search-sparkle"
        onClick={handleSparkleClick}
        title="AIで検索"
        role="button"
        aria-label="AIスマート検索"
      >
        ✦
      </span>
    </div>
  );
}
