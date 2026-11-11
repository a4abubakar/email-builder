"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { BLOCK_META } from "@/lib/email/blocks";
import { checkEmail } from "@/lib/email/checks";
import { copyText, downloadText, slugify } from "@/lib/download";
import { createEditorState, editorReducer } from "@/lib/email/reducer";
import { renderEmail } from "@/lib/email/render";
import { measureEmail } from "@/lib/email/size";
import { loadStoredDoc, newId, parseDocJson, saveStoredDoc, serializeDoc } from "@/lib/email/storage";
import { EMPTY_DOC, STARTER_TEMPLATES, getStarter } from "@/lib/email/templates";
import type { BlockType, EmailSettings } from "@/lib/email/types";
import { BlockList } from "./BlockList";
import { BlockPalette } from "./BlockPalette";
import { BuilderSkeleton } from "./BuilderSkeleton";
import { ExportPanel } from "./ExportPanel";
import { Icon } from "./Icon";
import { BlockInspector, SettingsPanel } from "./Inspector";
import { PreviewFrame, PreviewToolbar, type Viewport } from "./Preview";
import { TemplateMenu } from "./TemplateMenu";
import { ThemeToggle } from "./ThemeToggle";

type InspectorTab = "block" | "settings" | "export";
type MobilePane = "blocks" | "edit" | "preview";
interface Notice {
  kind: "info" | "error";
  text: string;
}

const noopSubscribe = () => () => {};

/** The editor is client-only (it reads localStorage and window.location), so render a skeleton until mounted. */
export function Builder() {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return mounted ? <BuilderApp /> : <BuilderSkeleton />;
}

function initialState() {
  return createEditorState(loadStoredDoc() ?? getStarter("renewal") ?? EMPTY_DOC);
}

function BuilderApp() {
  const [state, dispatch] = useReducer(editorReducer, undefined, initialState);
  const [tab, setTab] = useState<InspectorTab>("block");
  const [pane, setPane] = useState<MobilePane>("blocks");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [darkPreview, setDarkPreview] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { doc, selectedId } = state;
  const selected = doc.blocks.find((b) => b.id === selectedId) ?? null;
  const origin = window.location.origin;

  // Typing stays snappy: the preview and export HTML render from a deferred copy of the doc.
  const deferredDoc = useDeferredValue(doc);
  const exportHtml = useMemo(() => renderEmail(deferredDoc, { baseUrl: origin }), [deferredDoc, origin]);
  const previewHtml = useMemo(
    () => renderEmail(deferredDoc, { baseUrl: origin, forceDark: darkPreview }),
    [deferredDoc, origin, darkPreview],
  );
  const size = useMemo(() => measureEmail(exportHtml), [exportHtml]);
  const checks = useMemo(() => checkEmail(deferredDoc, { baseUrl: origin }), [deferredDoc, origin]);

  useEffect(() => {
    saveStoredDoc(doc);
  }, [doc]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const say = useCallback((text: string, kind: Notice["kind"] = "info") => setNotice({ kind, text }), []);

  /* ----- block actions ----- */

  const labelOf = (id: string) => {
    const b = doc.blocks.find((x) => x.id === id);
    return b ? BLOCK_META[b.type].label : "Block";
  };

  const select = (id: string) => {
    dispatch({ type: "select", id });
    setTab("block");
    setPane("edit");
  };

  const add = (type: BlockType) => {
    dispatch({ type: "add", blockType: type, id: newId(), afterId: selectedId });
    setTab("block");
    say(`Added ${BLOCK_META[type].label} block`);
  };

  const move = (id: string, delta: -1 | 1) => {
    const from = doc.blocks.findIndex((b) => b.id === id);
    dispatch({ type: "moveBy", id, delta });
    say(`Moved ${labelOf(id)} to position ${from + delta + 1} of ${doc.blocks.length}`);
  };

  const moveTo = (id: string, toIndex: number) => {
    dispatch({ type: "move", id, toIndex });
    say(`Moved ${labelOf(id)} to position ${toIndex + 1} of ${doc.blocks.length}`);
  };

  const duplicate = (id: string) => {
    dispatch({ type: "duplicate", id, newId: newId() });
    setTab("block");
    say(`Duplicated ${labelOf(id)}`);
  };

  const remove = (id: string) => {
    const label = labelOf(id);
    dispatch({ type: "delete", id });
    say(`Deleted ${label}. Undo is available.`);
  };

  const update = (id: string, patch: Record<string, string | number>) =>
    dispatch({ type: "update", id, patch });

  const updateSettings = (patch: Partial<EmailSettings>) => dispatch({ type: "settings", patch });

  /* ----- history ----- */

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ----- templates and files ----- */

  const loadStarter = (id: string) => {
    const next = getStarter(id);
    if (!next) return;
    dispatch({ type: "load", doc: next });
    say(`Loaded the ${STARTER_TEMPLATES.find((t) => t.id === id)?.name} template. Undo is available.`);
  };

  const clearDoc = () => {
    dispatch({ type: "load", doc: structuredClone(EMPTY_DOC) });
    say("Started a blank email. Undo is available.");
  };

  const fileName = `${slugify(doc.settings.subject)}`;

  const copyHtml = async () => {
    const ok = await copyText(exportHtml);
    say(ok ? `Copied ${size.kb} KB of HTML to the clipboard` : "Couldn't access the clipboard. Copy from the Export tab instead.", ok ? "info" : "error");
  };

  const downloadHtml = () => {
    downloadText(`${fileName}.html`, exportHtml, "text/html");
    say(`Downloaded ${fileName}.html`);
  };

  const exportJson = () => {
    downloadText(`${fileName}.json`, serializeDoc(doc), "application/json");
    say(`Saved ${fileName}.json`);
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const parsed = parseDocJson(await file.text());
    if (!parsed) {
      say(`"${file.name}" isn't a valid Quillmail template.`, "error");
      return;
    }
    dispatch({ type: "load", doc: parsed });
    say(`Imported ${file.name}. Undo is available.`);
  };

  /* ----- inspector tabs ----- */

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "block", label: "Block" },
    { id: "settings", label: "Settings" },
    { id: "export", label: "Export" },
  ];
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = tabs.findIndex((t) => t.id === tab);
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else return;
    e.preventDefault();
    setTab(tabs[next].id);
    document.getElementById(`tab-${tabs[next].id}`)?.focus();
  };

  const paneClass = (p: MobilePane) => (pane === p ? "flex" : "hidden") + " lg:flex";

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#preview"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg"
      >
        Skip to preview
      </a>

      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 sm:px-4">
        <h1 className="mr-2 flex items-center gap-2 text-lg font-bold tracking-tight">
          <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-md bg-accent text-accent-fg">
            <Icon name="layout" size={16} />
          </span>
          Quillmail
          <span className="hidden text-sm font-normal text-muted md:inline">Email template builder</span>
        </h1>
        <TemplateMenu onPick={loadStarter} onClear={clearDoc} />
        <div className="flex items-center gap-1" role="group" aria-label="History">
          <button type="button" className="btn-icon" onClick={undo} disabled={state.past.length === 0} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Icon name="undo" />
          </button>
          <button type="button" className="btn-icon" onClick={redo} disabled={state.future.length === 0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Icon name="redo" />
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button type="button" className="btn" onClick={exportJson}>
            <Icon name="download" size={16} />
            <span>Export JSON</span>
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={16} />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label="Import template JSON file"
            data-testid="import-json"
            onChange={(e) => {
              void importJson(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <ThemeToggle />
        </div>
      </header>

      <nav aria-label="Panels" className="grid grid-cols-3 gap-1 border-b border-border bg-surface p-1.5 lg:hidden">
        {(
          [
            ["blocks", "Blocks"],
            ["edit", "Edit"],
            ["preview", "Preview"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={pane === id}
            onClick={() => setPane(id)}
            className={`min-h-9 rounded-md text-sm font-medium ${pane === id ? "bg-accent text-accent-fg" : "hover:bg-surface-2"}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="min-h-0 flex-1 overflow-hidden lg:grid lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <aside
          aria-label="Blocks"
          className={`${paneClass("blocks")} h-full flex-col gap-5 overflow-y-auto border-border bg-bg p-3 lg:border-r`}
        >
          <section aria-labelledby="palette-heading">
            <h2 id="palette-heading" className="mb-2 text-sm font-semibold">
              Add a block
            </h2>
            <BlockPalette onAdd={add} />
          </section>
          <section aria-labelledby="structure-heading">
            <h2 id="structure-heading" className="mb-2 text-sm font-semibold">
              Email structure <span className="font-normal text-muted">({doc.blocks.length})</span>
            </h2>
            <BlockList
              blocks={doc.blocks}
              selectedId={selectedId}
              onSelect={select}
              onMove={move}
              onMoveTo={moveTo}
              onDuplicate={duplicate}
              onDelete={remove}
            />
          </section>
        </aside>

        <section
          id="preview"
          aria-label="Email preview"
          className={`${paneClass("preview")} h-full min-h-0 flex-col`}
        >
          <PreviewToolbar
            viewport={viewport}
            onViewport={setViewport}
            dark={darkPreview}
            onDark={setDarkPreview}
            size={size}
            onCopy={copyHtml}
            onDownload={downloadHtml}
          />
          <PreviewFrame html={previewHtml} viewport={viewport} />
        </section>

        <aside
          aria-label="Properties"
          className={`${paneClass("edit")} h-full min-h-0 flex-col border-border bg-surface lg:border-l`}
        >
          <div role="tablist" aria-label="Properties panels" className="grid grid-cols-3 border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={onTabKey}
                className={`min-h-11 border-b-2 text-sm font-medium ${
                  tab === t.id ? "border-accent text-fg" : "border-transparent text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div
            id={`panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab}`}
            className="min-h-0 flex-1 overflow-y-auto p-4"
          >
            {tab === "block" ? (
              <BlockInspector key={selected?.id ?? "none"} block={selected} onChange={update} />
            ) : tab === "settings" ? (
              <SettingsPanel settings={doc.settings} onChange={updateSettings} />
            ) : (
              <ExportPanel html={exportHtml} size={size} checks={checks} />
            )}
          </div>
        </aside>
      </main>

      {/* Screen-reader announcements and a visible toast share one live region. */}
      <div
        role={notice?.kind === "error" ? "alert" : "status"}
        aria-live={notice?.kind === "error" ? "assertive" : "polite"}
        className={
          notice
            ? `pointer-events-none fixed inset-x-3 bottom-3 z-40 mx-auto w-fit max-w-[calc(100vw-1.5rem)] rounded-lg border px-4 py-2 text-sm shadow-lg ${
                notice.kind === "error"
                  ? "border-danger bg-surface text-danger"
                  : "border-border bg-fg text-bg"
              }`
            : "sr-only"
        }
        data-testid="notice"
      >
        {notice?.text}
      </div>
    </div>
  );
}
