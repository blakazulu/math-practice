import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_PUBLIC_DATA = join(__dirname, "..", "public", "data");
const REPO_DATA = join(__dirname, "..", "..", "data");
const REPO_IMAGES = join(__dirname, "..", "..", "docs", "images");
const APP_PUBLIC_IMAGES = join(APP_PUBLIC_DATA, "images");

mkdirSync(APP_PUBLIC_DATA, { recursive: true });
mkdirSync(APP_PUBLIC_IMAGES, { recursive: true });

const dataFiles = ["questions.json", "image_dependent_questions.json"];
let copied = 0;
for (const f of dataFiles) {
  const src = join(REPO_DATA, f);
  if (!existsSync(src)) {
    console.warn(`! missing source: ${src} — skipping`);
    continue;
  }
  copyFileSync(src, join(APP_PUBLIC_DATA, f));
  copied++;
  console.log(`  ${f}`);
}

// mapping.json lives in docs/images/
const mappingSrc = join(REPO_IMAGES, "mapping.json");
if (existsSync(mappingSrc)) {
  copyFileSync(mappingSrc, join(APP_PUBLIC_DATA, "image_mapping.json"));
  console.log(`  image_mapping.json (from docs/images/mapping.json)`);
  copied++;
}

// Copy every image file under docs/images/ into public/data/images/
let imgCount = 0;
if (existsSync(REPO_IMAGES)) {
  for (const entry of readdirSync(REPO_IMAGES)) {
    const full = join(REPO_IMAGES, entry);
    if (!statSync(full).isFile()) continue;
    if (entry === "mapping.json") continue;
    copyFileSync(full, join(APP_PUBLIC_IMAGES, entry));
    imgCount++;
  }
}
if (imgCount > 0) console.log(`  ${imgCount} images -> public/data/images/`);

console.log(`synced ${copied} data file(s) + ${imgCount} images -> public/data/`);
