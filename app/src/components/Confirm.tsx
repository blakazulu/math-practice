import { useEffect, useRef } from "react";

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
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
      onClick={onCancel}
    >
      <div className="card p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
}
