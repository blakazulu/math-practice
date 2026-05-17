import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Trash2 } from "lucide-react";
import { useStore } from "@/store";
import { Logo } from "@/components/Logo";
import { Confirm } from "@/components/Confirm";
import { HeroBackdrop } from "@/components/HeroBackdrop";
import { useMagnetic } from "@/lib/useMagnetic";

export function WelcomePage() {
  const users = useStore((s) => s.users);
  const createUser = useStore((s) => s.createUser);
  const switchUser = useStore((s) => s.switchUser);
  const deleteUser = useStore((s) => s.deleteUser);
  const navigate = useNavigate();
  const submitRef = useMagnetic<HTMLButtonElement>();

  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const list = Object.values(users).sort((a, b) => a.createdAt - b.createdAt);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createUser(name.trim());
    navigate("/home");
  }

  function handlePick(id: string) {
    switchUser(id);
    navigate("/home");
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-16 overflow-hidden">
        <HeroBackdrop position="center-top" />
        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          <h1 className="h1-hero text-center mb-2">
            <span className="h1-hero-accent">ברוכים הבאים.</span>
          </h1>
          <p className="text-center text-muted mb-8">בחרו משתמש או צרו חדש.</p>

          {list.length > 0 && (
            <section className="mb-8">
              <div className="section-label mb-3">משתמשים קיימים</div>
              <ul className="space-y-2">
                {list.map((u) => (
                  <li key={u.id} className="card flex items-center gap-3 p-3">
                    <span className="relative w-10 h-10 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold">
                      <span
                        className="absolute inset-0 rounded-full bg-brand-300/40 animate-pulse-glow"
                        aria-hidden
                      />
                      <span className="relative">{u.name.slice(0, 1)}</span>
                    </span>
                    <button
                      onClick={() => handlePick(u.id)}
                      className="flex-1 text-right font-semibold"
                    >
                      {u.name}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      aria-label={`מחק את ${u.name}`}
                      className="p-2 rounded-lg text-muted hover:text-danger-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="section-label mb-3">הוספת משתמש</div>
            <form onSubmit={handleCreate} className="card p-4 space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-ink">מה השם שלך?</span>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="לדוגמה: נועה"
                    className="peer mt-1 w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus-visible:ring-0"
                    autoFocus
                  />
                  <span
                    aria-hidden
                    className="absolute right-0 bottom-0 h-[2px] w-full bg-brand-500 origin-right scale-x-0 peer-focus:scale-x-100 transition-transform duration-200"
                  />
                </div>
              </label>
              <button
                ref={submitRef}
                type="submit"
                disabled={!name.trim()}
                className="btn-primary w-full justify-center"
              >
                <UserPlus size={18} />
                התחל
              </button>
            </form>
          </section>
        </div>
      </div>

      <Confirm
        open={!!confirmDelete}
        title="למחוק את המשתמש?"
        body="פעולה זו תמחק את כל ההתקדמות של המשתמש לצמיתות."
        confirmLabel="מחק"
        destructive
        onConfirm={() => {
          if (confirmDelete) deleteUser(confirmDelete);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </main>
  );
}
