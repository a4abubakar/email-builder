import { describe, expect, it } from "vitest";
import { createEditorState, editorReducer, type EditorState } from "./reducer";
import { EMPTY_DOC, getStarter } from "./templates";

const start = (): EditorState => createEditorState(structuredClone(EMPTY_DOC));
const ids = (s: EditorState) => s.doc.blocks.map((b) => b.id);

function withThree(): EditorState {
  let s = start();
  s = editorReducer(s, { type: "add", blockType: "header", id: "a" });
  s = editorReducer(s, { type: "add", blockType: "text", id: "b", afterId: "a" });
  s = editorReducer(s, { type: "add", blockType: "cta", id: "c", afterId: "b" });
  return s;
}

describe("block reducer", () => {
  it("adds blocks at the end, or after a given block, and selects the new one", () => {
    let s = start();
    s = editorReducer(s, { type: "add", blockType: "text", id: "a" });
    s = editorReducer(s, { type: "add", blockType: "cta", id: "b" });
    s = editorReducer(s, { type: "add", blockType: "divider", id: "c", afterId: "a" });
    expect(ids(s)).toEqual(["a", "c", "b"]);
    expect(s.selectedId).toBe("c");
  });

  it("moves blocks by delta and to an index, clamping at the edges", () => {
    let s = withThree();
    s = editorReducer(s, { type: "moveBy", id: "c", delta: -1 });
    expect(ids(s)).toEqual(["a", "c", "b"]);
    const before = s;
    expect(editorReducer(s, { type: "moveBy", id: "a", delta: -1 })).toBe(before);
    s = editorReducer(s, { type: "move", id: "a", toIndex: 99 });
    expect(ids(s)).toEqual(["c", "b", "a"]);
  });

  it("duplicates right after the original with a new id and selects the copy", () => {
    let s = withThree();
    s = editorReducer(s, { type: "update", id: "b", patch: { heading: "Custom" } });
    s = editorReducer(s, { type: "duplicate", id: "b", newId: "b2" });
    expect(ids(s)).toEqual(["a", "b", "b2", "c"]);
    expect(s.selectedId).toBe("b2");
    expect(s.doc.blocks[2]).toMatchObject({ type: "text", heading: "Custom", id: "b2" });
    // The copy is independent of the original.
    s = editorReducer(s, { type: "update", id: "b2", patch: { heading: "Changed" } });
    expect(s.doc.blocks[1]).toMatchObject({ heading: "Custom" });
  });

  it("deletes a block and moves the selection to its neighbour", () => {
    let s = withThree();
    s = editorReducer(s, { type: "select", id: "b" });
    s = editorReducer(s, { type: "delete", id: "b" });
    expect(ids(s)).toEqual(["a", "c"]);
    expect(s.selectedId).toBe("c");
    s = editorReducer(s, { type: "delete", id: "c" });
    expect(s.selectedId).toBe("a");
    s = editorReducer(s, { type: "delete", id: "a" });
    expect(s.selectedId).toBeNull();
  });

  it("ignores unknown ids and never lets an update change a block's type or id", () => {
    const s = withThree();
    expect(editorReducer(s, { type: "delete", id: "nope" })).toBe(s);
    const u = editorReducer(s, { type: "update", id: "b", patch: { type: "cta", id: "zzz", heading: "x" } });
    expect(u.doc.blocks[1]).toMatchObject({ id: "b", type: "text", heading: "x" });
  });
});

describe("undo / redo", () => {
  it("undoes and redoes structural changes", () => {
    let s = withThree();
    s = editorReducer(s, { type: "delete", id: "b" });
    expect(ids(s)).toEqual(["a", "c"]);
    s = editorReducer(s, { type: "undo" });
    expect(ids(s)).toEqual(["a", "b", "c"]);
    s = editorReducer(s, { type: "redo" });
    expect(ids(s)).toEqual(["a", "c"]);
  });

  it("merges consecutive edits to the same field into one undo step", () => {
    let s = withThree();
    const depth = s.past.length;
    for (const v of ["H", "He", "Hel", "Hell", "Hello"]) {
      s = editorReducer(s, { type: "update", id: "b", patch: { heading: v } });
    }
    expect(s.past.length).toBe(depth + 1);
    s = editorReducer(s, { type: "undo" });
    expect(s.doc.blocks[1]).not.toMatchObject({ heading: "Hello" });
  });

  it("clears the redo stack after a new edit", () => {
    let s = withThree();
    s = editorReducer(s, { type: "undo" });
    expect(s.future).toHaveLength(1);
    s = editorReducer(s, { type: "add", blockType: "footer", id: "z" });
    expect(s.future).toHaveLength(0);
  });

  it("loads a starter as one undoable step", () => {
    let s = withThree();
    s = editorReducer(s, { type: "load", doc: getStarter("welcome")! });
    expect(s.doc.blocks.length).toBeGreaterThan(3);
    s = editorReducer(s, { type: "undo" });
    expect(ids(s)).toEqual(["a", "b", "c"]);
  });
});
