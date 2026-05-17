export type PdfCategory = "math-knowledge" | "logic-reasoning" | "sample-exams";

export interface PdfManifestEntry {
  slug: string;
  label_he: string;
  category: PdfCategory;
  url: string;
  questionCount: number;
}

function entry(
  slug: string,
  label_he: string,
  category: PdfCategory,
  questionCount: number,
): PdfManifestEntry {
  return { slug, label_he, category, url: `/data/pdfs/${slug}.pdf`, questionCount };
}

export const PDF_MANIFEST: PdfManifestEntry[] = [
  // math-knowledge (9)
  entry("math-knowledge-decimal-fractions", "שברים עשרוניים", "math-knowledge", 21),
  entry("math-knowledge-simple-fractions", "שברים פשוטים", "math-knowledge", 33),
  entry("math-knowledge-percentages", "אחוזים", "math-knowledge", 19),
  entry("math-knowledge-multi-step", "רב שלבי", "math-knowledge", 16),
  entry("math-knowledge-geometry", "גאומטריה", "math-knowledge", 32),
  entry("math-knowledge-data-research", "חקר נתונים", "math-knowledge", 23),
  entry("math-knowledge-ratio", "יחס", "math-knowledge", 15),
  entry("math-knowledge-throughput", "הספק", "math-knowledge", 15),
  entry("math-knowledge-average", "ממוצע", "math-knowledge", 15),

  // logic-reasoning (7)
  entry("logic-reasoning-factoring", "פירוק לגורמים", "logic-reasoning", 24),
  entry("logic-reasoning-invented-operation", "פעולה מומצאת", "logic-reasoning", 23),
  entry("logic-reasoning-truth-falsehood", "אמת ושקר", "logic-reasoning", 16),
  entry("logic-reasoning-sequences", "סדרות", "logic-reasoning", 17),
  entry("logic-reasoning-motion", "תנועה", "logic-reasoning", 15),
  entry("logic-reasoning-combinatorics", "קומבינטוריקה", "logic-reasoning", 27),
  entry("logic-reasoning-spatial-reasoning", "חשיבה מרחבית", "logic-reasoning", 18),

  // sample-exams (7)
  entry("sample-exams-exam-1", "מבחן לדוגמה 1", "sample-exams", 24),
  entry("sample-exams-exam-2", "מבחן לדוגמה 2", "sample-exams", 24),
  entry("sample-exams-exam-3", "מבחן לדוגמה 3", "sample-exams", 24),
  entry("sample-exams-exam-4", "מבחן לדוגמה 4", "sample-exams", 24),
  entry("sample-exams-exam-5", "מבחן לדוגמה 5", "sample-exams", 24),
  entry("sample-exams-exam-6", "מבחן לדוגמה 6", "sample-exams", 24),
  entry("sample-exams-exam-7", "מבחן לדוגמה 7", "sample-exams", 24),
];
