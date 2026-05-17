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

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="הגדרות" />

        <section className="card p-4 mb-4">
          <div className="section-label mb-3">משתמש</div>
          <div className="flex items-center gap-3 mb-3">
            <span className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-lg">
              {user.name.slice(0, 1)}
            </span>
            <div className="flex-1">
              <div className="font-bold">{user.name}</div>
              <div className="text-sm text-muted tabular-nums">
                {user.progress.stats.totalAnswered} שאלות נענו
              </div>
            </div>
          </div>
          <button onClick={() => navigate("/welcome")} className="btn-secondary w-full justify-center">
            <User size={18} />
            החלפת משתמש
          </button>
        </section>

        <section className="card p-4 mb-4">
          <div className="section-label mb-3">איפוס</div>
          <button
            onClick={() => setResetOpen(true)}
            className="btn-secondary w-full justify-center"
          >
            <RotateCcw size={18} />
            אפס את כל ההתקדמות
          </button>
        </section>

        <section className="card p-4 border-danger-200">
          <div className="section-label !text-danger-600 mb-3">אזור מסוכן</div>
          <button
            onClick={() => setDeleteOpen(true)}
            className="btn-secondary w-full justify-center !text-danger-600"
          >
            <Trash2 size={18} />
            מחק את המשתמש הזה
          </button>
        </section>
      </div>

      <Confirm
        open={resetOpen}
        title="לאפס את כל ההתקדמות?"
        body="כל ההיסטוריה, הכוכבים והרצפים יימחקו. פעולה זו אינה הפיכה."
        confirmLabel="אפס"
        destructive
        onConfirm={() => {
          resetUserProgress(user.id);
          setResetOpen(false);
        }}
        onCancel={() => setResetOpen(false)}
      />

      <Confirm
        open={deleteOpen}
        title={`למחוק את "${user.name}"?`}
        body="כל הנתונים של המשתמש יימחקו לצמיתות."
        confirmLabel="מחק"
        destructive
        onConfirm={() => {
          deleteUser(user.id);
          setDeleteOpen(false);
          navigate("/welcome", { replace: true });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}
