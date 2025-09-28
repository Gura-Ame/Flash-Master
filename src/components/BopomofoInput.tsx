import { useEffect, useMemo, useRef, useState } from 'react';

interface BopomofoInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function BopomofoInput({ value, onChange, placeholder, className }: BopomofoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  useEffect(() => {
    const touch = 'ontouchstart' in window || (navigator as any).maxTouchPoints > 0;
    setIsTouch(touch);
    setShowKeypad(touch);
  }, []);

  const keyMap = useMemo(() => new Map<string, string>([
    ['1', 'ㄅ'], ['2', 'ㄉ'], ['3', 'ˇ'], ['4', 'ˋ'], ['5', 'ㄓ'], ['6', 'ˊ'], ['7', '˙'], ['8', 'ㄚ'], ['9', 'ㄞ'], ['0', 'ㄢ'], ['-', 'ㄦ'],
    ['q', 'ㄆ'], ['w', 'ㄊ'], ['e', 'ㄍ'], ['r', 'ㄐ'], ['t', 'ㄔ'], ['y', 'ㄗ'], ['u', 'ㄧ'], ['i', 'ㄛ'], ['o', 'ㄟ'], ['p', 'ㄣ'], ['[', 'ㄥ'], ['/', 'ㄥ'],
    ['a', 'ㄇ'], ['s', 'ㄋ'], ['d', 'ㄎ'], ['f', 'ㄑ'], ['g', 'ㄕ'], ['h', 'ㄘ'], ['j', 'ㄨ'], ['k', 'ㄜ'], ['l', 'ㄠ'], [';', 'ㄤ'],
    ['z', 'ㄈ'], ['x', 'ㄌ'], ['c', 'ㄏ'], ['v', 'ㄒ'], ['b', 'ㄖ'], ['n', 'ㄙ'], ['m', 'ㄩ'], [',', 'ㄝ'], ['.', 'ㄡ'],
  ]), []);

  function insertAtCursor(text: string) {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = before + text + after;
    onChange(next);
    const newPos = start + text.length;
    // set caret on next tick after state update
    requestAnimationFrame(() => {
      el.setSelectionRange(newPos, newPos);
      el.focus();
    });
  }

  // Desktop: intercept keydown to inject bopomofo
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isTouch) return; // touch uses keypad
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyMap.has(key)) {
      e.preventDefault();
      insertAtCursor(keyMap.get(key)!);
    } else if (
      key === 'Backspace' || key === 'Delete' || key.startsWith('Arrow') || key === 'Tab' || key === 'Enter'
    ) {
      // allow control keys
      return;
    } else if (key.length === 1) {
      // block other visible characters
      e.preventDefault();
    }
  }

  // Block IME composition
  function preventComposition(e: React.CompositionEvent<HTMLInputElement>) {
    e.preventDefault();
  }

  // Mobile keypad keys
  const keypadRows: string[][] = [
    ['ㄅ','ㄆ','ㄇ','ㄈ','ㄉ','ㄊ','ㄋ','ㄌ'],
    ['ㄍ','ㄎ','ㄏ','ㄐ','ㄑ','ㄒ','ㄓ','ㄔ','ㄕ','ㄖ'],
    ['ㄗ','ㄘ','ㄙ','ㄧ','ㄨ','ㄩ'],
    ['ㄚ','ㄛ','ㄜ','ㄝ','ㄞ','ㄟ','ㄠ','ㄡ','ㄢ','ㄣ','ㄤ','ㄥ','ㄦ'],
    ['˙','ˊ','ˇ','ˋ']
  ];

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={preventComposition}
        onCompositionUpdate={preventComposition}
        onCompositionEnd={preventComposition}
        placeholder={placeholder}
        lang="en"
        inputMode={isTouch ? 'none' as any : 'latin'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="input input-bordered w-full"
        readOnly={isTouch}
      />

  {isTouch && (
      <div className="mt-2">
        <button type="button" className="btn btn-xs btn-ghost" onClick={() => setShowKeypad((s) => !s)}>
          {showKeypad ? '隱藏注音鍵盤' : '顯示注音鍵盤'}
        </button>
      </div>
    )}

      {showKeypad && (
        <div className="mt-2 card bg-base-100 border border-base-300 p-2 space-y-2">
          {keypadRows.map((row, idx) => (
            <div key={idx} className="flex flex-wrap gap-2">
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => insertAtCursor(k)}
                >
                  {k}
                </button>
              ))}
              {idx === keypadRows.length - 1 && (
                <>
                  <button type="button" className="btn btn-sm" onClick={() => insertAtCursor(' ')}>␣</button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      const el = inputRef.current;
                      if (!el) return;
                      const start = el.selectionStart ?? value.length;
                      const end = el.selectionEnd ?? value.length;
                      if (start === end && start > 0) {
                        el.setSelectionRange(start - 1, end);
                      }
                      insertAtCursor('');
                    }}
                  >
                    ⌫
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


