import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createBlock } from "@/lib/email/blocks";
import { measureEmail } from "@/lib/email/size";
import { BlockList } from "./BlockList";
import { ExportPanel } from "./ExportPanel";
import { BlockInspector } from "./Inspector";

describe("BlockList", () => {
  const blocks = [createBlock("header", "a"), createBlock("text", "b"), createBlock("footer", "c")];
  const handlers = () => ({
    onSelect: vi.fn(),
    onMove: vi.fn(),
    onMoveTo: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
  });

  it("offers move up/down buttons as the keyboard alternative to dragging, disabled at the edges", async () => {
    const h = handlers();
    render(<BlockList blocks={blocks} selectedId="b" {...h} />);
    expect(screen.getByRole("button", { name: "Move Header up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move Footer down" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Move Text down" }));
    expect(h.onMove).toHaveBeenCalledWith("b", 1);
    await userEvent.click(screen.getByRole("button", { name: "Duplicate Text" }));
    expect(h.onDuplicate).toHaveBeenCalledWith("b");
    await userEvent.click(screen.getByRole("button", { name: "Delete Footer" }));
    expect(h.onDelete).toHaveBeenCalledWith("c");
  });

  it("marks the selected row and shows an empty state when there are no blocks", () => {
    const h = handlers();
    const { rerender } = render(<BlockList blocks={blocks} selectedId="b" {...h} />);
    const rows = screen.getAllByTestId("block-row");
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(rows[0]).not.toHaveAttribute("aria-current");

    rerender(<BlockList blocks={[]} selectedId={null} {...h} />);
    expect(screen.getByTestId("empty-state")).toHaveTextContent("This email is empty");
  });
});

describe("BlockInspector", () => {
  it("shows a hint when nothing is selected", () => {
    render(<BlockInspector block={null} onChange={vi.fn()} />);
    expect(screen.getByText(/Select a block in the list/)).toBeInTheDocument();
  });

  it("renders labelled fields for the block and reports edits as patches", async () => {
    const onChange = vi.fn();
    render(<BlockInspector block={createBlock("cta", "x")} onChange={onChange} />);
    const label = screen.getByLabelText("Button label");
    expect(label).toHaveValue("Get started");
    await userEvent.type(label, "!");
    expect(onChange).toHaveBeenLastCalledWith("x", { label: "Get started!" });
    expect(screen.getByLabelText("Button URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Alignment")).toBeInTheDocument();
  });
});

describe("ExportPanel", () => {
  it("warns about Gmail clipping once the HTML passes 102 KB", () => {
    const html = "x".repeat(103 * 1024);
    render(<ExportPanel html={html} size={measureEmail(html)} checks={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/Gmail will clip/);
    expect(screen.getByTestId("size-detail")).toHaveTextContent("103 KB of 102 KB");
  });

  it("is calm for a small email and lists check results", () => {
    const html = "<p>hi</p>";
    render(
      <ExportPanel
        html={html}
        size={measureEmail(html)}
        checks={[{ level: "warn", message: "No preheader text" }]}
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByTestId("checks")).toHaveTextContent("No preheader text");
  });
});
