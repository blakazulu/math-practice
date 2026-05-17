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

  it("renders three category sections when open", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    expect(screen.getByText("ידע מתמטי")).toBeInTheDocument();
    expect(screen.getByText("חשיבה והגיון")).toBeInTheDocument();
    expect(screen.getByText("מבחנים לדוגמה")).toBeInTheDocument();
  });

  it("renders one row per manifest entry", () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
    for (const e of PDF_MANIFEST) {
      expect(screen.getByText(e.label_he)).toBeInTheDocument();
    }
  });

  it("each row has an anchor with the correct href + download attribute when available", async () => {
    render(<DownloadTestsModal open onClose={() => {}} />);
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
    await waitFor(() => {
      expect(screen.getAllByText("לא זמין כרגע").length).toBeGreaterThan(0);
    });
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<DownloadTestsModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("סגירה"));
    expect(onClose).toHaveBeenCalled();
  });
});
