import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({
  open,
  title,
  body,
  confirmLabel = "אישור",
  cancelLabel = "ביטול",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="card p-6 max-w-md w-full shadow-xl rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            {body && <p className="text-muted mb-4">{body}</p>}
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel} className="btn-secondary">
                {cancelLabel}
              </button>
              <button
                ref={ref}
                onClick={onConfirm}
                className={
                  destructive
                    ? "btn-primary !bg-danger-600 shadow-[0_4px_0_#991B1B] active:shadow-[0_2px_0_#991B1B]"
                    : "btn-primary"
                }
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
