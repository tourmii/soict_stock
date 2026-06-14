import { useEffect, useRef, useState } from 'react';
import { STOCKS } from '../../lib/constants';

// Wraps a textarea and shows a $TICKER autocomplete dropdown when user types "$..."
export default function TickerAutocomplete({ value, onChange, textareaProps = {} }) {
  const textareaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [triggerStart, setTriggerStart] = useState(-1); // index of the $ in value

  const detectTrigger = (text, cursorPos) => {
    // Walk backward from cursor to find a $ trigger
    let i = cursorPos - 1;
    while (i >= 0 && /[A-Za-z0-9]/.test(text[i])) i--;
    if (i >= 0 && text[i] === '$') {
      const query = text.slice(i + 1, cursorPos).toUpperCase();
      return { start: i, query };
    }
    return null;
  };

  const handleChange = (e) => {
    const text = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(e);

    const trigger = detectTrigger(text, cursor);
    if (!trigger) {
      setSuggestions([]);
      setTriggerStart(-1);
      return;
    }

    setTriggerStart(trigger.start);
    const q = trigger.query;
    if (q.length === 0) {
      // Show top 6 stocks when just $ typed
      setSuggestions(STOCKS.slice(0, 6));
      return;
    }
    const filtered = STOCKS.filter(s =>
      s.ticker.startsWith(q) ||
      s.ticker.includes(q) ||
      s.name.toUpperCase().includes(q)
    ).slice(0, 6);
    setSuggestions(filtered);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const insertSuggestion = (ticker) => {
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const text = value;
    // Replace from triggerStart to cursor with $TICKER
    const before = text.slice(0, triggerStart);
    const after = text.slice(cursor);
    const newValue = before + '$' + ticker + ' ' + after;
    // Trigger onChange with synthetic event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, newValue);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    // Also call onChange directly with synthetic event
    onChange({ target: { value: newValue } });
    setSuggestions([]);
    // Set cursor after the inserted text
    const newCursor = before.length + 1 + ticker.length + 1;
    requestAnimationFrame(() => {
      el.setSelectionRange(newCursor, newCursor);
      el.focus();
    });
  };

  // Close on outside click
  useEffect(() => {
    const close = () => setSuggestions([]);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...textareaProps}
      />
      {suggestions.length > 0 && (
        <div
          onMouseDown={(e) => e.preventDefault()} // prevent blur
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            zIndex: 200,
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '200px',
            maxWidth: '280px',
            overflow: 'hidden',
            marginBottom: '4px',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: '10px', color: 'var(--gray-400)', fontWeight: 700, borderBottom: '1px solid var(--gray-100)', background: 'var(--gray-50)' }}>
            STOCK TAGS
          </div>
          {suggestions.map((stock) => (
            <button
              key={stock.ticker}
              type="button"
              onClick={() => insertSuggestion(stock.ticker)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
                fontSize: '13px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{
                fontWeight: 800,
                fontSize: '12px',
                color: stock.color || 'var(--primary)',
                background: `${stock.color || '#1B3BFC'}15`,
                padding: '2px 6px',
                borderRadius: '4px',
                minWidth: '40px',
                textAlign: 'center',
              }}>
                ${stock.ticker}
              </span>
              <span style={{ color: 'var(--gray-600)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {stock.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
