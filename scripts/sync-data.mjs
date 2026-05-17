import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const PUBLIC_DATA = join(REPO_ROOT, "public", "data");
const SRC_DATA = join(REPO_ROOT, "data");
const SRC_IMAGES = join(REPO_ROOT, "docs", "images");
const PUBLIC_IMAGES = join(PUBLIC_DATA, "images");

mkdirSync(PUBLIC_DATA, { recursive: true });
mkdirSync(PUBLIC_IMAGES, { recursive: true });

const dataFiles = ["questions.json", "image_dependent_questions.json"];
let copied = 0;
for (const f of dataFiles) {
  const src = join(SRC_DATA, f);
  if (!existsSync(src)) {
    console.warn(`! missing source: ${src} — skipping`);
    continue;
  }
  copyFileSync(src, join(PUBLIC_DATA, f));
  copied++;
  console.log(`  ${f}`);
}

// mapping.json lives in docs/images/
const mappingSrc = join(SRC_IMAGES, "mapping.json");
if (existsSync(mappingSrc)) {
  copyFileSync(mappingSrc, join(PUBLIC_DATA, "image_mapping.json"));
  console.log(`  image_mapping.json (from docs/images/mapping.json)`);
  copied++;
}

// Copy every image file under docs/images/ into public/data/images/
let imgCount = 0;
if (existsSync(SRC_IMAGES)) {
  for (const entry of readdirSync(SRC_IMAGES)) {
    const full = join(SRC_IMAGES, entry);
    if (!statSync(full).isFile()) continue;
    if (entry === "mapping.json") continue;
    copyFileSync(full, join(PUBLIC_IMAGES, entry));
    imgCount++;
  }
}
if (imgCount > 0) console.log(`  ${imgCount} images -> public/data/images/`);

console.log(`synced ${copied} data file(s) + ${imgCount} images -> public/data/`);
