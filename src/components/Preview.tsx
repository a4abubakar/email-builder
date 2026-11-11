"use client";

import { Icon } from "./Icon";
import { measureEmail, GMAIL_CLIP_BYTES } from "@/lib/email/size";

export type Viewport = "desktop" | "mobile";

/** Desktop frame is the 600px email plus 20px of background margin each side; mobile is a 375px phone. */
const FRAME_WIDTH: Record<Viewport, number> = { desktop: 640, mobile: 375 };

export function PreviewToolbar({
  viewport,
  onViewport,
  dark,
  onDark,
  size,
  onCopy,
  onDownload,
}: {
  viewport: Viewport;
  onViewport: (v: Viewport) => void;
  dark: boolean;
  onDark: (v: boolean) => void;
  size: ReturnType<typeof measureEmail>;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const sizeColour =
    size.level === "over" ? "text-danger" : size.level === "warn" ? "text-warn-fg bg-warn-bg" : "text-muted";
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
      <div role="group" aria-label="Preview width" className="inline-flex overflow-hidden rounded-md border border-border">
        {(["desktop", "mobile"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={viewport === v}
            onClick={() => onViewport(v)}
            className={`inline-flex min-h-9 items-center gap-1.5 px-3 text-sm font-medium ${
              viewport === v ? "bg-accent text-accent-fg" : "bg-surface hover:bg-surface-2"
            }`}
          >
            <Icon name={v === "desktop" ? "monitor" : "phone"} size={16} />
            {v === "desktop" ? "Desktop 600px" : "Mobile 375px"}
          </button>
        ))}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={() => onDark(!dark)}
        className={`btn ${dark ? "!border-accent !bg-accent-soft" : ""}`}
      >
        <Icon name={dark ? "check" : "moon"} size={16} />
        Dark mode preview
      </button>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span
          data-testid="size-badge"
          className={`rounded-md px-2 py-1 text-sm font-medium tabular-nums ${sizeColour}`}
          title={`Gmail clips messages over ${Math.round(GMAIL_CLIP_BYTES / 1024)} KB`}
        >
          {size.kb} KB
          <span className="sr-only"> of the Gmail clipping limit ({size.percentOfLimit}%)</span>
        </span>
        <button type="button" className="btn" onClick={onCopy}>
          <Icon name="clipboard" size={16} />
          Copy HTML
        </button>
        <button type="button" className="btn btn-primary" onClick={onDownload}>
          <Icon name="download" size={16} />
          Download .html
        </button>
      </div>
    </div>
  );
}

export function PreviewFrame({
  html,
  viewport,
}: {
  html: string;
  viewport: Viewport;
}) {
  return (
    <div className="flex-1 overflow-auto bg-stage p-3">
      <iframe
        title="Email preview"
        data-testid="preview-frame"
        data-viewport={viewport}
        // Empty sandbox: no scripts, no forms, no navigation, unique origin. The exported HTML is untrusted input.
        sandbox=""
        srcDoc={html}
        style={{ width: FRAME_WIDTH[viewport] }}
        className="mx-auto block h-full min-h-[560px] max-w-none rounded-md border border-border bg-white shadow-sm"
      />
    </div>
  );
}
