"use client";
import { useState } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  accent?: string;
}

export default function TagInput({ tags, onChange, placeholder, accent = "var(--ember)" }: TagInputProps) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(tags.filter(t => t !== tag));
  }

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 8, padding: "10px 12px",
      borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.02)", minHeight: 46,
    }}>
      {tags.map(tag => (
        <span key={tag} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 12.5, color: "var(--ivory)", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)", padding: "5px 6px 5px 12px", borderRadius: 20,
        }}>
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Remove ${tag}`}
            style={{
              width: 16, height: 16, borderRadius: "50%", border: "none",
              background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)",
              fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
          if (e.key === "Backspace" && !draft && tags.length > 0) remove(tags[tags.length - 1]);
        }}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          flex: 1, minWidth: 100, background: "transparent", border: "none", outline: "none",
          color: "var(--ivory)", fontSize: 13, padding: "4px 2px",
        }}
      />
    </div>
  );
}
