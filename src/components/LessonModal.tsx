import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { RawLesson } from "@/data/types";
import { LessonContent } from "./LessonContent";

interface Props {
  open: boolean;
  lesson: RawLesson | null;
  onClose: () => void;
}

export function LessonModal({ open, lesson, onClose }: Props) {
  const reduced = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panelInitial = reduced ? { opacity: 0 } : { y: 32, opacity: 0, scale: 0.96 };
  const panelAnimate = reduced ? { opacity: 1 } : { y: 0, opacity: 1, scale: 1 };
  const panelExit = reduced ? { opacity: 0 } : { y: 24, opacity: 0, scale: 0.98 };
  const panelTransition = reduced
    ? { duration: 0.15 }
    : { type: "spring" as const, stiffness: 340, damping: 28 };

  return (
    <AnimatePresence>
      {open && lesson && (
        <motion.div
          data-lesson-overlay
          role="dialog"
          aria-modal="true"
          aria-label={lesson.title}
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4 py-0 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[85vh] overflow-hidden"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
              <h2 className="text-lg font-bold text-ink">{lesson.title}</h2>
              <button
                ref={closeRef}
                aria-label="סגירה"
                className="p-2 rounded-md hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={onClose}
              >
                <X size={20} />
              </button>
            </header>
            <div className="px-5 py-5 overflow-y-auto">
              <LessonContent body={lesson.body} />
            </div>
            <footer className="px-5 py-3 border-t border-ink/10 flex justify-end">
              <button
                className="px-4 py-2 rounded-md text-brand-700 hover:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500"
                onClick={onClose}
              >
                חזרה לתרגיל
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
