#!/usr/bin/env node
/**
 * Render the share card + favicon set as PNGs via Playwright.
 *
 * Source templates live in scripts/share-templates/ as HTML so the design is
 * editable in plain HTML/CSS, fonts (Heebo) come from Google Fonts, and the
 * output is pixel-perfect for any viewport size.
 *
 * Output goes to public/ — Vite serves it at the site root.
 */
import { chromium } from "playwright";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = resolve(__dirname, "share-templates");
const OUTPUT = resolve(__dirname, "..", "public");

mkdirSync(OUTPUT, { recursive: true });

const TARGETS = [
  // Hero share card (Open Graph / Twitter)
  { src: "og-card.html", out: "og-image.png", w: 1200, h: 630, scale: 1 },
  // Apple touch icon (180x180 is the recommended size for iOS home screen)
  { src: "icon.html", out: "apple-touch-icon.png", w: 180, h: 180, scale: 1 },
  // Android Chrome — PWA / homescreen icons
  { src: "icon.html", out: "android-chrome-192x192.png", w: 192, h: 192, scale: 1 },
  { src: "icon.html", out: "android-chrome-512x512.png", w: 512, h: 512, scale: 1 },
  // Favicons — render at high DPI so the downscaled raster is crisp
  { src: "icon.html", out: "favicon-32x32.png", w: 32, h: 32, scale: 4 },
  { src: "icon.html", out: "favicon-16x16.png", w: 16, h: 16, scale: 4 },
];

const browser = await chromium.launch();

for (const t of TARGETS) {
  const context = await browser.newContext({
    viewport: { width: t.w, height: t.h },
    deviceScaleFactor: t.scale,
  });
  const page = await context.newPage();
  const url = pathToFileURL(resolve(TEMPLATES, t.src)).href;
  await page.goto(url, { waitUntil: "networkidle" });
  // Wait for web fonts so Heebo (not the fallback) ends up in the screenshot.
  await page.evaluate(() => (document.fonts && document.fonts.ready) || null);
  await page.screenshot({
    path: resolve(OUTPUT, t.out),
    type: "png",
    omitBackground: false,
  });
  await context.close();
  console.log(`  ${t.out}  (${t.w}x${t.h}${t.scale > 1 ? ` @${t.scale}x` : ""})`);
}

await browser.close();
console.log("share images written to public/");
