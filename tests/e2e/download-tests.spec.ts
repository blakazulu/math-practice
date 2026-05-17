import { test, expect } from "@playwright/test";

test("download modal shows collapsible categories and downloads one PDF", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => window.localStorage.clear());
  await page.goto("/welcome");

  // Sign in to land on HomePage
  await page.getByPlaceholder("לדוגמה: נועה").fill("בודק");
  await page.getByRole("button", { name: /התחל/ }).click();

  // Open the download modal from the HomePage header
  await page.getByRole("button", { name: "הורדת מבחנים" }).click();

  // Three category headers appear, all collapsed
  const dialog = page.getByRole("dialog", { name: "הורדת מבחנים" });
  await expect(dialog).toBeVisible();
  const mathHeader = dialog.getByRole("button", { name: /ידע מתמטי/ });
  const logicHeader = dialog.getByRole("button", { name: /חשיבה והגיון/ });
  const examsHeader = dialog.getByRole("button", { name: /מבחנים לדוגמה/ });
  await expect(mathHeader).toHaveAttribute("aria-expanded", "false");
  await expect(logicHeader).toHaveAttribute("aria-expanded", "false");
  await expect(examsHeader).toHaveAttribute("aria-expanded", "false");

  // With everything collapsed, only the 'Download all' CTA is visible
  await expect(dialog.getByRole("link")).toHaveCount(1);

  // Expand all three sections — 23 topic links + 1 zip CTA = 24 total
  await mathHeader.click();
  await logicHeader.click();
  await examsHeader.click();
  await expect(dialog.getByRole("link")).toHaveCount(24);

  // Click the first per-topic link and assert a PDF download begins
  const firstTopicLink = dialog.getByRole("link").nth(0);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    firstTopicLink.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});

test("the 'הורדת כל המבחנים' CTA downloads the bundled ZIP", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => window.localStorage.clear());
  await page.goto("/welcome");
  await page.getByPlaceholder("לדוגמה: נועה").fill("בודק");
  await page.getByRole("button", { name: /התחל/ }).click();
  await page.getByRole("button", { name: "הורדת מבחנים" }).click();

  const dialog = page.getByRole("dialog", { name: "הורדת מבחנים" });
  const zipCta = dialog.getByRole("link", { name: /הורדת כל המבחנים/ });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    zipCta.click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});
