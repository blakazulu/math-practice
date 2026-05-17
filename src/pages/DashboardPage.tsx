import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Flame, Target, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatBan } from "@/components/dashboard/StatBan";
import { SortedTopicBars } from "@/components/dashboard/SortedTopicBars";
import { selectActiveUser, useStore } from "@/store";
import { pageEnter, useMotionVariants } from "@/lib/motion";
import {
  overallMasteryPct,
  firstTryAccuracyPct,
  todaySparkline,
  masteryTrendSparkline,
  masteryByTopic,
} from "@/lib/dashboardStats";

export function DashboardPage() {
  const user = useStore(selectActiveUser);
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  const navigate = useNavigate();

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  const page = useMotionVariants(pageEnter);

  if (!user) {
    navigate("/welcome", { replace: true });
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
        <PageHeader backTo="/home" title="לוח התקדמות" />

        <motion.div initial="hidden" animate="show" variants={page} className="space-y-8">
          {!bank && <p className="text-muted">טוען נתונים…</p>}
          {bank && (() => {
            const firstTry = firstTryAccuracyPct(user);
            return (
            <>
              <section
                aria-label="סטטיסטיקות כלליות"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
              >
                <StatBan
                  label="כוכבים"
                  value={user.progress.stats.starsEarned}
                  icon={<Star size={20} />}
                  tint="warn"
                />
                <StatBan
                  label="רצף ימים"
                  value={user.progress.stats.currentStreakDays}
                  icon={<Flame size={20} />}
                  tint="danger"
                />
                <StatBan
                  label="היום"
                  value={user.progress.stats.todayCount}
                  icon={<Target size={20} />}
                  sparkline={todaySparkline(user)}
                />
                <StatBan
                  label="שליטה כוללת"
                  value={overallMasteryPct(user, bank)}
                  unit="%"
                  icon={<TrendingUp size={20} />}
                  sparkline={masteryTrendSparkline(user, bank)}
                />
              </section>

              <p className="text-base text-muted">
                {firstTry === null
                  ? "ענו על השאלה הראשונה כדי להתחיל לעקוב אחר ההצלחה."
                  : `דיוק בניסיון ראשון: ${firstTry}%`}
              </p>

              <SortedTopicBars rows={masteryByTopic(user, bank)} />
              {/* Section 3: Topic bullet graphs */}
              {/* Section 4: Exam progression */}
              {/* Section 5: Action cards */}
            </>
            );
          })()}
        </motion.div>
      </div>
    </main>
  );
}
