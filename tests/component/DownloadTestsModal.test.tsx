import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DownloadTestsModal, __resetProbeCacheForTests } from "@/components/DownloadTestsModal";
import { PDF_MANIFEST } from "@/data/pdfManifest";

function setFetchOk() {
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 200 })) as any;
}

function setFetchAllMissing() {
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 404 })) as any;
}

function expandAll() {
  const buttons = screen.getAllByRole("button", { expanded: false });
  for (const b of buttons) {
    if (b.getAttribute("aria-controls")?.startsWith("dl-cat-")) {
      fireEvent.click(b);
    }
  }
}

describe("DownloadTestsModal", () => {
  beforeEach(() => {
    __resetProbeCacheForTests();
    setFetchOk();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<DownloadTestsModal open={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders three category headers when open", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    expect(screen.getByText("ידע מתמטי")).toBeInTheDocument();
    expect(screen.getByText("חשיבה והגיון")).toBeInTheDocument();
    expect(screen.getByText("מבחנים לדוגמה")).toBeInTheDocument();
  });

  it("starts with every category collapsed (no manifest rows visible)", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    for (const e of PDF_MANIFEST) {
      expect(screen.queryByText(e.label_he)).not.toBeInTheDocument();
    }
  });

  it("category headers expose aria-expanded and aria-controls", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    const mathHeader = screen.getByRole("button", { name: /ידע מתמטי/ });
    expect(mathHeader).toHaveAttribute("aria-expanded", "false");
    expect(mathHeader).toHaveAttribute("aria-controls", "dl-cat-math-knowledge");
  });

  it("clicking a category header expands it; clicking again collapses", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    const mathHeader = screen.getByRole("button", { name: /ידע מתמטי/ });
    fireEvent.click(mathHeader);
    expect(mathHeader).toHaveAttribute("aria-expanded", "true");
    // After expand, math-knowledge entries are visible
    const firstMathEntry = PDF_MANIFEST.find((e) => e.category === "math-knowledge")!;
    expect(screen.getByText(firstMathEntry.label_he)).toBeInTheDocument();
    fireEvent.click(mathHeader);
    expect(mathHeader).toHaveAttribute("aria-expanded", "false");
  });

  it("renders one row per manifest entry once all categories are expanded", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    expandAll();
    for (const e of PDF_MANIFEST) {
      expect(screen.getByText(e.label_he)).toBeInTheDocument();
    }
  });

  it("each expanded row has an anchor with the correct href + download attribute when available", async () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    expandAll();
    await waitFor(() => {
      const first = PDF_MANIFEST[0];
      const anchor = screen.getByRole("link", { name: new RegExp(first.label_he) });
      expect(anchor).toHaveAttribute("href", first.url);
      expect(anchor).toHaveAttribute("download");
    });
  });

  it("shows 'לא זמין כרגע' for rows whose HEAD probe returns 404", async () => {
    setFetchAllMissing();
    render(<DownloadTestsModal open onClose={() => {}} />);
    expandAll();
    await waitFor(() => {
      expect(screen.getAllByText("לא זמין כרגע").length).toBe(PDF_MANIFEST.length);
    });
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<DownloadTestsModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("סגירה"));
    expect(onClose).toHaveBeenCalled();
  });
});
