import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { Logo } from "@/components/Logo";
import { Confirm } from "@/components/Confirm";
export function WelcomePage() {
    const users = useStore((s) => s.users);
    const createUser = useStore((s) => s.createUser);
    const switchUser = useStore((s) => s.switchUser);
    const deleteUser = useStore((s) => s.deleteUser);
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const list = Object.values(users).sort((a, b) => a.createdAt - b.createdAt);
    function handleCreate(e) {
        e.preventDefault();
        if (!name.trim())
            return;
        createUser(name.trim());
        navigate("/home");
    }
    function handlePick(id) {
        switchUser(id);
        navigate("/home");
    }
    return (_jsxs("main", { className: "min-h-screen bg-white px-4 py-6 sm:py-12", children: [_jsxs("div", { className: "max-w-md mx-auto", children: [_jsx("div", { className: "flex justify-center mb-8", children: _jsx(Logo, {}) }), _jsx("h1", { className: "h1-hero text-center mb-2", children: _jsx("span", { className: "h1-hero-accent", children: "\u05D1\u05E8\u05D5\u05DB\u05D9\u05DD \u05D4\u05D1\u05D0\u05D9\u05DD." }) }), _jsx("p", { className: "text-center text-muted mb-8", children: "\u05D1\u05D7\u05E8\u05D5 \u05DE\u05E9\u05EA\u05DE\u05E9 \u05D0\u05D5 \u05E6\u05E8\u05D5 \u05D7\u05D3\u05E9." }), list.length > 0 && (_jsxs("section", { className: "mb-8", children: [_jsx("div", { className: "section-label mb-3", children: "\u05DE\u05E9\u05EA\u05DE\u05E9\u05D9\u05DD \u05E7\u05D9\u05D9\u05DE\u05D9\u05DD" }), _jsx("ul", { className: "space-y-2", children: list.map((u) => (_jsxs("li", { className: "card flex items-center gap-3 p-3", children: [_jsx("span", { className: "w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold", children: u.name.slice(0, 1) }), _jsx("button", { onClick: () => handlePick(u.id), className: "flex-1 text-right font-semibold", children: u.name }), _jsx("button", { onClick: () => setConfirmDelete(u.id), "aria-label": `מחק את ${u.name}`, className: "p-2 rounded-lg text-muted hover:text-danger-600", children: _jsx(Trash2, { size: 18 }) })] }, u.id))) })] })), _jsxs("section", { children: [_jsx("div", { className: "section-label mb-3", children: "\u05D4\u05D5\u05E1\u05E4\u05EA \u05DE\u05E9\u05EA\u05DE\u05E9" }), _jsxs("form", { onSubmit: handleCreate, className: "card p-4 space-y-3", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-sm font-semibold text-ink", children: "\u05DE\u05D4 \u05D4\u05E9\u05DD \u05E9\u05DC\u05DA?" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "\u05DC\u05D3\u05D5\u05D2\u05DE\u05D4: \u05E0\u05D5\u05E2\u05D4", className: "mt-1 w-full px-3 py-2 rounded-lg border border-border focus-visible:ring-2 ring-brand-500 outline-none", autoFocus: true })] }), _jsxs("button", { type: "submit", disabled: !name.trim(), className: "btn-primary w-full justify-center", children: [_jsx(UserPlus, { size: 18 }), "\u05D4\u05EA\u05D7\u05DC"] })] })] })] }), _jsx(Confirm, { open: !!confirmDelete, title: "\u05DC\u05DE\u05D7\u05D5\u05E7 \u05D0\u05EA \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9?", body: "\u05E4\u05E2\u05D5\u05DC\u05D4 \u05D6\u05D5 \u05EA\u05DE\u05D7\u05E7 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05EA\u05E7\u05D3\u05DE\u05D5\u05EA \u05E9\u05DC \u05D4\u05DE\u05E9\u05EA\u05DE\u05E9 \u05DC\u05E6\u05DE\u05D9\u05EA\u05D5\u05EA.", confirmLabel: "\u05DE\u05D7\u05E7", destructive: true, onConfirm: () => {
                    if (confirmDelete)
                        deleteUser(confirmDelete);
                    setConfirmDelete(null);
                }, onCancel: () => setConfirmDelete(null) })] }));
}
