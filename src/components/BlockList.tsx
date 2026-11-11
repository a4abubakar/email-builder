"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_META, summarizeBlock } from "@/lib/email/blocks";
import type { Block } from "@/lib/email/types";
import { Icon } from "./Icon";

interface RowProps {
  block: Block;
  index: number;
  total: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

function BlockRow({ block, index, total, selected, onSelect, onMove, onDuplicate, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const label = BLOCK_META[block.type].label;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-testid="block-row"
      data-block-type={block.type}
      aria-current={selected ? "true" : undefined}
      className={`rounded-lg border bg-surface ${
        selected ? "border-accent ring-1 ring-accent" : "border-border"
      } ${isDragging ? "relative z-10 opacity-80 shadow-lg" : ""}`}
    >
      <div className="flex items-center gap-1 px-1.5 pt-1.5">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${label}, position ${index + 1} of ${total}`}
          className="btn-icon cursor-grab touch-none active:cursor-grabbing"
        >
          <Icon name="grip" />
        </button>
        <button
          type="button"
          onClick={() => onSelect(block.id)}
          aria-label={`Edit ${label}: ${summarizeBlock(block)}`}
          className="min-w-0 flex-1 rounded-md px-1.5 py-1 text-left hover:bg-surface-2"
        >
          <span className="block text-sm font-semibold leading-tight">{label}</span>
          <span className="block truncate text-xs text-muted">{summarizeBlock(block)}</span>
        </button>
      </div>
      <div className="flex items-center justify-end gap-0.5 px-1.5 pb-1.5 pt-0.5" role="group" aria-label={`${label} actions`}>
        <button
          type="button"
          className="btn-icon"
          disabled={index === 0}
          onClick={() => onMove(block.id, -1)}
          aria-label={`Move ${label} up`}
          title="Move up"
        >
          <Icon name="up" />
        </button>
        <button
          type="button"
          className="btn-icon"
          disabled={index === total - 1}
          onClick={() => onMove(block.id, 1)}
          aria-label={`Move ${label} down`}
          title="Move down"
        >
          <Icon name="down" />
        </button>
        <button
          type="button"
          className="btn-icon"
          onClick={() => onDuplicate(block.id)}
          aria-label={`Duplicate ${label}`}
          title="Duplicate"
        >
          <Icon name="copy" />
        </button>
        <button
          type="button"
          className="btn-icon hover:text-danger"
          onClick={() => onDelete(block.id)}
          aria-label={`Delete ${label}`}
          title="Delete"
        >
          <Icon name="trash" />
        </button>
      </div>
    </li>
  );
}

export function BlockList({
  blocks,
  selectedId,
  onSelect,
  onMove,
  onMoveTo,
  onDuplicate,
  onDelete,
}: {
  blocks: Block[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onMoveTo: (id: string, toIndex: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const to = blocks.findIndex((b) => b.id === over.id);
    if (to !== -1) onMoveTo(String(active.id), to);
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted" data-testid="empty-state">
        <p className="font-medium text-fg">This email is empty.</p>
        <p className="mt-1">Add a block above, or load a starter template from the Templates menu.</p>
      </div>
    );
  }

  return (
    <DndContext id="block-list" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2" aria-label="Email blocks in order">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              block={b}
              index={i}
              total={blocks.length}
              selected={b.id === selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
