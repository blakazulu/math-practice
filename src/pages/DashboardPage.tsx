import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { selectActiveUser, useStore } from "@/store";
import { pageEnter } from "@/lib/motion";

export function DashboardPage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/welcome", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!user) return null;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="לוח התקדמות" />

        <motion.div initial="hidden" animate="show" variants={pageEnter} className="space-y-8">
          {!bank && <p className="text-muted">טוען נתונים…</p>}
          {bank && (
            <>
              {/* Section 1: Hero BANs */}
              {/* Section 2: Topic strength bars */}
              {/* Section 3: Topic bullet graphs */}
              {/* Section 4: Exam progression */}
              {/* Section 5: Action cards */}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
