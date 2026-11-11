"use client";

import { BLOCK_META } from "@/lib/email/blocks";
import { BLOCK_TYPES, type BlockType } from "@/lib/email/types";
import { Icon } from "./Icon";

export function BlockPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-2" aria-label="Block palette">
      {BLOCK_TYPES.map((type) => {
        const meta = BLOCK_META[type];
        return (
          <li key={type}>
            <button
              type="button"
              onClick={() => onAdd(type)}
              aria-label={`Add ${meta.label}`}
              title={meta.description}
              className="btn h-full w-full justify-start gap-1.5 px-2.5 py-2 text-left"
            >
              <Icon name="plus" size={14} className="shrink-0 text-accent" />
              <span className="leading-tight">{meta.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
