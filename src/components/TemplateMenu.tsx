"use client";

import { useEffect, useId, useRef, useState } from "react";
import { STARTER_TEMPLATES } from "@/lib/email/templates";
import { Icon } from "./Icon";

export function TemplateMenu({ onPick, onClear }: { onPick: (id: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="btn"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="layout" size={16} />
        Templates
        <Icon name="down" size={14} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="group"
          aria-label="Starter templates"
          className="absolute left-0 top-full z-30 mt-1 w-72 rounded-lg border border-border bg-surface p-1.5 shadow-lg"
        >
          {STARTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              className="block w-full rounded-md px-2.5 py-2 text-left hover:bg-surface-2"
              onClick={() => {
                onPick(t.id);
                setOpen(false);
              }}
            >
              <span className="block text-sm font-semibold">{t.name}</span>
              <span className="block text-xs text-muted">{t.description}</span>
            </button>
          ))}
          <hr className="my-1 border-border" />
          <button
            type="button"
            className="block w-full rounded-md px-2.5 py-2 text-left text-sm hover:bg-surface-2"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            Start from a blank email
          </button>
        </div>
      ) : null}
    </div>
  );
}
