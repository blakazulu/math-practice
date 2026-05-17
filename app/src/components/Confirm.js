import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
export function Confirm({ open, title, body, confirmLabel = "אישור", cancelLabel = "ביטול", destructive, onConfirm, onCancel, }) {
    const ref = useRef(null);
    useEffect(() => {
        if (open)
            ref.current?.focus();
    }, [open]);
    if (!open)
        return null;
    return (_jsx("div", { role: "dialog", "aria-modal": "true", className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40", onClick: onCancel, children: _jsxs("div", { className: "card p-6 max-w-md w-full shadow-xl", onClick: (e) => e.stopPropagation(), children: [_jsx("h2", { className: "text-lg font-bold mb-2", children: title }), body && _jsx("p", { className: "text-muted mb-4", children: body }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx("button", { onClick: onCancel, className: "btn-secondary", children: cancelLabel }), _jsx("button", { ref: ref, onClick: onConfirm, className: destructive
                                ? "btn-primary !bg-danger-600 shadow-[0_4px_0_#991B1B] active:shadow-[0_2px_0_#991B1B]"
                                : "btn-primary", children: confirmLabel })] })] }) }));
}
