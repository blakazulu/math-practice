import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Download, X, FileDown } from "lucide-react";
import { PDF_MANIFEST, type PdfCategory, type PdfManifestEntry } from "@/data/pdfManifest";

interface Props {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_ORDER: PdfCategory[] = ["math-knowledge", "logic-reasoning", "sample-exams"];
const CATEGORY_LABEL: Record<PdfCategory, string> = {
  "math-knowledge": "ידע מתמטי",
  "logic-reasoning": "חשיבה והגיון",
  "sample-exams": "מבחנים לדוגמה",
};

const GROUPED: Record<PdfCategory, PdfManifestEntry[]> = (() => {
  const out: Record<PdfCategory, PdfManifestEntry[]> = {
    "math-knowledge": [],
    "logic-reasoning": [],
    "sample-exams": [],
  };
  for (const e of PDF_MANIFEST) out[e.category].push(e);
  return out;
})();

// Module-level cache so reopening the modal doesn't re-probe.
const probeCache: Record<string, boolean> = {};

export function __resetProbeCacheForTests() {
  for (const k of Object.keys(probeCache)) delete probeCache[k];
}

export function DownloadTestsModal({ open, onClose }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  const [availability, setAvailability] = useState<Record<string, boolean>>(probeCache);
  const [expanded, setExpanded] = useState<Record<PdfCategory, boolean>>({
    "math-knowledge": false,
    "logic-reasoning": false,
    "sample-exams": false,
  });

  function toggle(cat: PdfCategory) {
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    let cancelled = false;
    const toProbe = PDF_MANIFEST.filter((e) => probeCache[e.url] === undefined);
    if (toProbe.length === 0) {
      setAvailability({ ...probeCache });
      return;
    }
    if (toProbe.length > 0) {
      Promise.all(
        toProbe.map(async (e) => {
          try {
            const res = await fetch(e.url, { method: "HEAD" });
            probeCache[e.url] = res.ok;
          } catch {
            probeCache[e.url] = false;
          }
        }),
      ).then(() => {
        if (!cancelled) setAvailability({ ...probeCache });
      });
    }

    return () => {
      window.removeEventListener("keydown", onKey);
      cancelled = true;
    };
  }, [open, onClose]);

  const panelInitial = reduced ? { opacity: 0 } : { y: 32, opacity: 0, scale: 0.96 };
  const panelAnimate = reduced ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 };
  const panelExit = reduced ? { opacity: 0 } : { y: 24, opacity: 0, scale: 0.98 };
  const panelTransition = reduced
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 340, damping: 28 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="הורדת מבחנים"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            className="card w-full max-w-2xl max-h-[88vh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-hair">
              <div className="flex items-start gap-3 min-w-0">
                <span className="w-11 h-11 rounded-xl grid place-items-center bg-brand-100 text-brand-600 shrink-0">
                  <FileDown size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-ink">הורדת מבחנים</h2>
                  <p className="text-muted text-base">
                    בחרו נושא או מבחן לדוגמה להורדה כקובץ PDF.
                  </p>
                </div>
              </div>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="סגירה"
                className="shrink-0 rounded-full p-2 hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
              {CATEGORY_ORDER.map((cat) => {
                const isOpen = expanded[cat];
                const panelId = `dl-cat-${cat}`;
                return (
                  <section key={cat}>
                    <button
                      type="button"
                      onClick={() => toggle(cat)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="card w-full flex items-center justify-between gap-3 p-4 text-right hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span className="font-bold text-lg text-ink">
                          {CATEGORY_LABEL[cat]}
                        </span>
                        <span className="text-base text-muted tabular-nums">
                          {GROUPED[cat].length}
                        </span>
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: reduced ? 0 : 0.18 }}
                        className="shrink-0 text-muted"
                      >
                        <ChevronDown size={20} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.ul
                          id={panelId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: reduced ? 0 : 0.22 }}
                          style={{ overflow: "hidden" }}
                          className="space-y-2 mt-2"
                        >
                          {GROUPED[cat].map((entry) => {
                            // Optimistic: show as available until the HEAD probe says otherwise.
                            const available = availability[entry.url] ?? true;
                            return (
                              <li key={entry.slug}>
                                {available ? (
                                  <a
                                    href={entry.url}
                                    download
                                    aria-label={`הורדת ${entry.label_he} – ${entry.questionCount} שאלות`}
                                    className="card flex items-center gap-3 p-4 hover:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500"
                                  >
                                    <span className="flex-1 min-w-0">
                                      <span className="block font-bold text-lg text-ink leading-snug">
                                        {entry.label_he}
                                      </span>
                                      <span className="block text-base text-muted mt-0.5 tabular-nums">
                                        {entry.questionCount} שאלות
                                      </span>
                                    </span>
                                    <span className="shrink-0 inline-flex items-center gap-1.5 text-brand-700 font-semibold">
                                      <Download size={18} />
                                      הורדה
                                    </span>
                                  </a>
                                ) : (
                                  <div
                                    className="card flex items-center gap-3 p-4 opacity-60"
                                    aria-disabled="true"
                                  >
                                    <span className="flex-1 min-w-0">
                                      <span className="block font-bold text-lg text-ink leading-snug">
                                        {entry.label_he}
                                      </span>
                                      <span className="block text-base text-muted mt-0.5">
                                        לא זמין כרגע
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
