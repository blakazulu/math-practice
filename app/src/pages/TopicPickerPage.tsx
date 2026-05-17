import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useStore } from "@/store";
import { topicIdFor, urlFromTopicId } from "@/data/types";

export function TopicPickerPage() {
  const bank = useStore((s) => s.bank);
  const loadBank = useStore((s) => s.loadBank);
  useEffect(() => {
    loadBank();
  }, [loadBank]);

  if (!bank) {
    return (
      <main className="min-h-screen bg-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <PageHeader backTo="/home" title="בחרי נושא" />
          <p className="text-muted">טוען...</p>
        </div>
      </main>
    );
  }

  const cats = bank.categories.filter((c) => c.id !== "sample-exams");

  return (
    <main className="min-h-screen bg-white px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <PageHeader backTo="/home" title="בחרי נושא" />
        {cats.map((cat) => (
          <section key={cat.id} className="mb-6">
            <h2 className="section-label mb-2">{cat.name_he}</h2>
            <div className="card divide-y divide-hair">
              {cat.topics.map((t) => (
                <Link
                  key={t.id}
                  to={`/practice/${urlFromTopicId(topicIdFor(cat.id, t.id))}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-surface"
                >
                  <span className="font-semibold">{t.name_he}</span>
                  <span className="text-sm text-faint tabular-nums">
                    {t.question_count} שאלות
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
