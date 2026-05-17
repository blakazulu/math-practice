import { test, expect } from "@playwright/test";

test("download modal lists 23 PDFs and downloads one", async ({ page, context }) => {
  await context.addInitScript(() => window.localStorage.clear());
  await page.goto("/welcome");

  // Sign in to land on HomePage
  await page.getByPlaceholder("לדוגמה: נועה").fill("בודק");
  await page.getByRole("button", { name: /התחל/ }).click();

  // Open the download modal from the HomePage header
  await page.getByRole("button", { name: "הורדת מבחנים" }).click();

  // Three category sections appear
  const dialog = page.getByRole("dialog", { name: "הורדת מבחנים" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("ידע מתמטי")).toBeVisible();
  await expect(dialog.getByText("חשיבה והגיון")).toBeVisible();
  await expect(dialog.getByText("מבחנים לדוגמה")).toBeVisible();

  // 23 download links inside the modal
  const links = page.getByRole("dialog").getByRole("link");
  await expect(links).toHaveCount(23);

  // Click the first link and assert a download begins
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    links.first().click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
});
