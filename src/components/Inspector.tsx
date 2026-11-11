"use client";

import { BLOCK_META, type FieldDef } from "@/lib/email/blocks";
import { FONT_STACKS, type Block, type EmailSettings } from "@/lib/email/types";
import {
  ColorField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./fields";

export function BlockInspector({
  block,
  onChange,
}: {
  block: Block | null;
  onChange: (id: string, patch: Record<string, string | number>) => void;
}) {
  if (!block) {
    return (
      <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted">
        Select a block in the list to edit its content. Changes appear in the preview as you type.
      </p>
    );
  }
  const meta = BLOCK_META[block.type];
  const record = block as unknown as Record<string, string | number>;

  const renderField = (f: FieldDef) => {
    const value = record[f.key];
    switch (f.kind) {
      case "number":
        return (
          <NumberField
            key={f.key}
            label={f.label}
            help={f.help}
            min={f.min}
            max={f.max}
            value={Number(value)}
            onChange={(n) => onChange(block.id, { [f.key]: n })}
          />
        );
      case "select":
        return (
          <SelectField
            key={f.key}
            label={f.label}
            help={f.help}
            options={f.options ?? []}
            value={String(value)}
            onChange={(v) => onChange(block.id, { [f.key]: v })}
          />
        );
      case "textarea":
        return (
          <TextAreaField
            key={f.key}
            label={f.label}
            help={f.help}
            value={String(value)}
            onChange={(v) => onChange(block.id, { [f.key]: v })}
          />
        );
      default:
        return (
          <TextField
            key={f.key}
            label={f.label}
            help={f.help}
            type={f.kind === "url" ? "url" : "text"}
            value={String(value)}
            onChange={(v) => onChange(block.id, { [f.key]: v })}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">{meta.label}</h3>
        <p className="text-sm text-muted">{meta.description}</p>
      </div>
      {meta.fields.map(renderField)}
    </div>
  );
}

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: EmailSettings;
  onChange: (patch: Partial<EmailSettings>) => void;
}) {
  const stacks = FONT_STACKS.some((f) => f.value === settings.fontStack)
    ? FONT_STACKS
    : [{ label: "Custom (imported)", value: settings.fontStack }, ...FONT_STACKS];
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">Global settings</h3>
        <p className="text-sm text-muted">Applied to every block.</p>
      </div>
      <TextField
        label="Subject line"
        help="Used as the HTML title."
        value={settings.subject}
        onChange={(v) => onChange({ subject: v })}
      />
      <TextAreaField
        label="Preheader text"
        rows={2}
        help={`${settings.preheader.length} characters. Inboxes show roughly 40 to 110 after the subject.`}
        value={settings.preheader}
        onChange={(v) => onChange({ preheader: v })}
      />
      <ColorField
        label="Brand colour"
        help="Buttons, hero band, links. Text colour is picked for contrast automatically."
        value={settings.brandColor}
        onChange={(v) => onChange({ brandColor: v })}
      />
      <ColorField
        label="Background colour"
        value={settings.backgroundColor}
        onChange={(v) => onChange({ backgroundColor: v })}
      />
      <SelectField
        label="Font stack"
        help="Web-safe stacks only: custom fonts don't load in most inboxes."
        value={settings.fontStack}
        options={stacks}
        onChange={(v) => onChange({ fontStack: v })}
      />
      <div className="space-y-1">
        <label htmlFor="email-width" className="block text-sm font-medium">
          Email width
        </label>
        <input
          id="email-width"
          className="field-input"
          value={`${settings.width} px (fixed)`}
          readOnly
          aria-readonly="true"
        />
        <p className="text-xs text-muted">600px is the safe width for desktop clients; mobile goes fluid.</p>
      </div>
    </div>
  );
}
