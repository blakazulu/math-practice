export interface MathPart {
  kind: "text" | "math";
  value: string;
}

export function splitOnMath(text: string): MathPart[];

export interface PdfImageMappingEntry {
  q_id: string;
  q_num: number;
  topic: string;
  file: string;
  question_excerpt: string;
  image_file: string | string[] | null;
  source_q_num: number | null;
  note: string;
}

export interface PdfRenderOptions {
  title: string;
  questions: Array<{
    id: string;
    number: number;
    question: string;
    options: Partial<Record<"א" | "ב" | "ג" | "ד", string>>;
    correct_answer: string;
    correct_letter: string | null;
    explanation: string;
    flags: string[];
  }>;
  mapping?: { mapping: PdfImageMappingEntry[] } | null;
  imagesBaseUrl?: string;
  cssHref?: string;
  katexHref?: string;
}

export function renderTopicHtml(opts: PdfRenderOptions): string;
