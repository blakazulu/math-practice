import { FileDown } from "lucide-react";

interface Props {
  onClick: () => void;
  /** Optional className to position the button differently per page. */
  className?: string;
}

export function DownloadTestsButton({ onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="הורדת מבחנים"
      className={
        className ??
        "p-3 rounded-full hover:bg-hair focus-visible:ring-2 focus-visible:ring-brand-500"
      }
    >
      <FileDown size={20} />
    </button>
  );
}
