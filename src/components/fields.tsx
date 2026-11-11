"use client";

import { useId, useState, type ReactNode } from "react";
import { normalizeHex } from "@/lib/email/color";

function FieldShell({
  id,
  label,
  help,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {help ? (
        <p id={`${id}-help`} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
}

interface BaseProps {
  label: string;
  help?: string;
}

export function TextField({
  label,
  help,
  value,
  onChange,
  type = "text",
  placeholder,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "url";
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <input
        id={id}
        type={type === "url" ? "text" : type}
        inputMode={type === "url" ? "url" : undefined}
        autoComplete="off"
        spellCheck={type === "url" ? false : undefined}
        className="field-input"
        value={value}
        placeholder={placeholder}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  help,
  value,
  onChange,
  rows = 4,
}: BaseProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <textarea
        id={id}
        rows={rows}
        className="field-input resize-y"
        value={value}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
    </FieldShell>
  );
}

export function NumberField({
  label,
  help,
  value,
  onChange,
  min,
  max,
}: BaseProps & {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const id = useId();
  // Keep a local draft so the field can be cleared and retyped without the value snapping back.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <FieldShell id={id} label={label} help={help}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        className="field-input"
        value={draft ?? String(value)}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n)) onChange(n);
        }}
        onBlur={() => setDraft(null)}
      />
    </FieldShell>
  );
}

export function SelectField({
  label,
  help,
  value,
  onChange,
  options,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} help={help}>
      <select
        id={id}
        className="field-input"
        value={value}
        aria-describedby={help ? `${id}-help` : undefined}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function ColorField({
  label,
  help,
  value,
  onChange,
}: BaseProps & { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  return (
    <FieldShell id={id} label={label} help={help}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-1"
          value={normalizeHex(value, "#000000")}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          id={id}
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          className="field-input font-mono"
          value={shown}
          aria-describedby={help ? `${id}-help` : undefined}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            const hex = normalizeHex(v, "");
            if (hex) onChange(hex);
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </FieldShell>
  );
}
