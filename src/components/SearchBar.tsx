import { useState } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px'
    }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '10px 16px 10px 40px',
          backgroundColor: 'var(--input-bg, #0f0f1a)',
          border: `1px solid ${focused ? 'var(--primary-color, #ff6b6b)' : 'var(--border-color, #2d2d44)'}`,
          borderRadius: '8px',
          color: 'var(--text-primary, #e0e0e0)',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          boxSizing: 'border-box'
        }}
      />
      <span style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '16px',
        pointerEvents: 'none'
      }}>
        🔍
      </span>
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #9ca3af)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
