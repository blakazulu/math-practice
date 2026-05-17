import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_PUBLIC_DATA = join(__dirname, "..", "public", "data");
const REPO_DATA = join(__dirname, "..", "..", "data");

const files = ["questions.json", "image_dependent_questions.json"];

mkdirSync(APP_PUBLIC_DATA, { recursive: true });
let copied = 0;
for (const f of files) {
  const src = join(REPO_DATA, f);
  const dst = join(APP_PUBLIC_DATA, f);
  if (!existsSync(src)) {
    console.warn(`! missing source: ${src} — skipping`);
    continue;
  }
  copyFileSync(src, dst);
  copied++;
  console.log(`  ${f}`);
}
console.log(`synced ${copied} file(s) -> public/data/`);
