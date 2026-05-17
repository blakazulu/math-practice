import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, User, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Confirm } from "@/components/Confirm";
import { selectActiveUser, useStore } from "@/store";
export function SettingsPage() {
    const user = useStore(selectActiveUser);
    const resetUserProgress = useStore((s) => s.resetUserProgress);
    const deleteUser = useStore((s) => s.deleteUser);
    const navigate = useNavigate();
    const [resetOpen, setResetOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    if (!user) {
        navigate("/welcome", { replace: true });
        return null;
    }
    return (_jsxs("main", { className: "min-h-screen bg-white px-4 py-6", children: [_jsxs("div", { className: "max-w-xl mx-auto", children: [_jsx(PageHeader, { backTo: "/home", title: "\u05D4\u05D2\u05D3\u05E8\u05D5\u05EA" }), _jsxs("section", { className: "card p-4 mb-4", children: [_jsx("div", { className: "section-label mb-3", children: "\u05DE\u05E9\u05EA\u05DE\u05E9" }), _jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("span", { className: "w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-lg", children: user.name.slice(0, 1) }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-bold", children: user.name }), _jsxs("div", { className: "text-sm text-muted tabular-nums", children: [user.progress.stats.totalAnswered, " \u05E9\u05D0\u05DC\u05D5\u05EA \u05E0\u05E2\u05E0\u05D5"] })] })] }), _jsxs("button", { onClick: () => navigate("/welcome"), className: "btn-secondary w-full justify-center", children: [_jsx(User, { size: 18 }), "\u05D4\u05D7\u05DC\u05E4\u05EA \u05DE\u05E9\u05EA\u05DE\u05E9"] })] }), _jsxs("section", { className: "card p-4 mb-4", children: [_jsx("div", { className: "section-label mb-3", children: "\u05D0\u05D9\u05E4\u05D5\u05E1" }), _jsxs("button", { onClick: () => setResetOpen(true), className: "btn-secondary w-full justify-center", children: [_jsx(RotateCcw, { size: 18 }), "\u05D0\u05E4\u05E1 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA"] })] }), _jsxs("section", { className: "card p-4 border-danger-200", children: [_jsx("div", { className: "section-label !text-danger-600 mb-3", children: "\u05D0\u05D6\u05D5\u05E8 \u05DE\u05E1\u05D5\u05DB\u05DF" }), _jsxs("button", { onClick: () => setDeleteOpen(true), className: "btn-secondary w-full justify-center !text-danger-600", children: [_jsx(Trash2, { size: 18 }), "\u05DE\u05D7\u05E7 \u05D0\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D4\u05D6\u05D4"] })] })] }), _jsx(Confirm, { open: resetOpen, title: "\u05DC\u05D0\u05E4\u05E1 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA?", body: "\u05DB\u05DC \u05D4\u05D4\u05D9\u05E1\u05D8\u05D5\u05E8\u05D9\u05D4, \u05D4\u05DB\u05D5\u05DB\u05D1\u05D9\u05DD \u05D5\u05D4\u05E8\u05E6\u05E4\u05D9\u05DD \u05D9\u05D9\u05DE\u05D7\u05E7\u05D5. \u05E4\u05E2\u05D5\u05DC\u05D4 \u05D6\u05D5 \u05D0\u05D9\u05E0\u05D4 \u05D4\u05E4\u05D9\u05DB\u05D4.", confirmLabel: "\u05D0\u05E4\u05E1", destructive: true, onConfirm: () => {
                    resetUserProgress(user.id);
                    setResetOpen(false);
                }, onCancel: () => setResetOpen(false) }), _jsx(Confirm, { open: deleteOpen, title: `למחוק את "${user.name}"?`, body: "\u05DB\u05DC \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05E9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05D9\u05D9\u05DE\u05D7\u05E7\u05D5 \u05DC\u05E6\u05DE\u05D9\u05EA\u05D5\u05EA.", confirmLabel: "\u05DE\u05D7\u05E7", destructive: true, onConfirm: () => {
                    deleteUser(user.id);
                    setDeleteOpen(false);
                    navigate("/welcome", { replace: true });
                }, onCancel: () => setDeleteOpen(false) })] }));
}
