import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function ExamLessonConfirmDialog({ open, onConfirm, onDismiss }: Props) {
  const reduced = useReducedMotion();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="לפתוח עזרה?"
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="bg-white max-w-md w-full rounded-2xl p-6 shadow-xl"
            initial={reduced ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-ink font-medium leading-relaxed">
              לפתוח עזרה? זה לא ייפסל מהציון אבל זה משנה את אופי המבחן.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                autoFocus
                onClick={onDismiss}
                className="px-4 py-2 rounded-md text-ink hover:bg-ink/5 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                ביטול
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 rounded-md text-white bg-brand-600 hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                כן, לפתוח
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
