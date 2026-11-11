"use client";

import type { Check } from "@/lib/email/checks";
import { GMAIL_CLIP_BYTES, type EmailSize } from "@/lib/email/size";

export function ExportPanel({
  html,
  size,
  checks,
}: {
  html: string;
  size: EmailSize;
  checks: Check[];
}) {
  const limitKb = Math.round(GMAIL_CLIP_BYTES / 1024);
  const barColour =
    size.level === "over" ? "bg-danger" : size.level === "warn" ? "bg-warn-fg" : "bg-accent";
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Export</h3>
        <p className="text-sm text-muted">
          Table-based HTML with inline styles, Outlook conditionals and a VML button.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">HTML size</span>
          <span className="tabular-nums" data-testid="size-detail">
            {size.kb} KB of {limitKb} KB
          </span>
        </div>
        <div
          role="meter"
          aria-label="HTML size against Gmail's clipping limit"
          aria-valuemin={0}
          aria-valuemax={limitKb}
          aria-valuenow={Math.min(size.kb, limitKb)}
          aria-valuetext={`${size.kb} KB of ${limitKb} KB (${size.percentOfLimit}%)`}
          className="h-2 overflow-hidden rounded-full bg-surface-2"
        >
          <div className={`h-full ${barColour}`} style={{ width: `${Math.min(100, size.percentOfLimit)}%` }} />
        </div>
        {size.level !== "ok" ? (
          <p role="status" className="rounded-md bg-warn-bg p-2 text-sm text-warn-fg">
            {size.level === "over"
              ? `Over ${limitKb} KB: Gmail will clip this email and hide the footer and unsubscribe link behind "View entire message".`
              : `Close to Gmail's ${limitKb} KB clipping limit. ESP tracking code adds weight, so trim copy or images before sending.`}
          </p>
        ) : (
          <p className="text-xs text-muted">Gmail clips HTML larger than {limitKb} KB.</p>
        )}
      </div>

      <section aria-labelledby="checks-heading" className="space-y-1.5">
        <h4 id="checks-heading" className="text-sm font-semibold">
          Pre-send checks
        </h4>
        {checks.length === 0 ? (
          <p className="text-sm text-ok">No issues found.</p>
        ) : (
          <ul className="space-y-1" data-testid="checks">
            {checks.map((c, i) => (
              <li
                key={i}
                className={`rounded-md border px-2 py-1.5 text-sm ${
                  c.level === "warn" ? "border-warn-fg/40 bg-warn-bg text-warn-fg" : "border-border bg-surface-2 text-muted"
                }`}
              >
                <span className="font-semibold">{c.level === "warn" ? "Warning: " : "Note: "}</span>
                {c.message}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-1">
        <label htmlFor="export-html" className="block text-sm font-semibold">
          HTML source
        </label>
        <textarea
          id="export-html"
          readOnly
          value={html}
          rows={14}
          spellCheck={false}
          className="field-input h-72 resize-y whitespace-pre font-mono text-xs leading-snug"
        />
      </div>
    </div>
  );
}
