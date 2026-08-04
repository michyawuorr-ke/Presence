"use client";

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelectChips({ options, selected, onChange }: MultiSelectChipsProps) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            style={{
              fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 20, cursor: "pointer",
              background: on ? "rgba(226,109,52,0.12)" : "rgba(255,255,255,0.02)",
              color: on ? "var(--ember)" : "rgba(240,237,232,0.55)",
              border: on ? "1px solid rgba(226,109,52,0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
