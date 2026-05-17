import { useEffect, useRef } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Share, PlusSquare, X } from "lucide-react";
import { Ornament } from "./Ornament";
import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { useMotionVariants } from "@/lib/motion";

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

const sheetVariants: Variants = {
  hidden: { y: "100%", opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 360, damping: 32 },
  },
};

export function InstallPromptSheet() {
  const { shouldShow, platform, install, dismiss } = useInstallPrompt();
  const closeRef = useRef<HTMLButtonElement>(null);

  const reducedBackdrop = useMotionVariants(backdropVariants);
  const reducedSheet = useMotionVariants(sheetVariants);

  useEffect(() => {
    if (!shouldShow) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      if (previouslyFocused && previouslyFocused !== document.body) {
        previouslyFocused.focus?.();
      }
    };
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shouldShow, dismiss]);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-prompt-title"
          initial="hidden"
          animate="show"
          exit="hidden"
          variants={reducedBackdrop}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            variants={reducedSheet}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="w-full max-w-md bg-white rounded-t-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-brand-500" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-brand-600">
                    <Ornament name="sprout-mark" size={32} />
                  </span>
                  <h2 id="install-prompt-title" className="text-lg font-bold leading-tight">
                    {platform === "ios"
                      ? "הוסיפו את חשבונייה למסך הבית"
                      : "התקינו את חשבונייה במכשיר"}
                  </h2>
                </div>
                <button
                  ref={closeRef}
                  onClick={dismiss}
                  aria-label="סגירה"
                  className="p-2 -m-2 text-muted hover:text-ink transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {platform === "ios" ? (
                <>
                  <ol className="space-y-3 mb-5 text-ink">
                    <li className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Share size={18} />
                      </span>
                      <span>הקישו על כפתור השיתוף בתחתית המסך</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                        <PlusSquare size={18} />
                      </span>
                      <span>בחרו "הוסף למסך הבית"</span>
                    </li>
                  </ol>
                  <div className="flex justify-end">
                    <button onClick={dismiss} className="btn-primary">
                      הבנתי
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-muted mb-5">
                    גישה מהירה מהמסך הבית, בלי דפדפן.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button onClick={dismiss} className="btn-secondary">
                      לא עכשיו
                    </button>
                    <button onClick={install} className="btn-primary">
                      התקינו עכשיו
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
