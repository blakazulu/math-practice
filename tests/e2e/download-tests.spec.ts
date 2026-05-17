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

  // With everything collapsed, no download links are visible yet
  await expect(dialog.getByRole("link")).toHaveCount(0);

  // Expand all three sections — 23 download links total
  await mathHeader.click();
  await logicHeader.click();
  await examsHeader.click();
  await expect(dialog.getByRole("link")).toHaveCount(23);

  // Click the first link and assert a download begins
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog.getByRole("link").first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
