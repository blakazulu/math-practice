import { test, expect } from "@playwright/test";

test("first-time user creates account, picks a topic, sees a question", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => window.localStorage.clear());
  await page.goto("/");

  // Welcome screen
  await expect(page.getByText("ברוכים הבאים.")).toBeVisible();
  await page.getByPlaceholder("לדוגמה: נועה").fill("נועה");
  await page.getByRole("button", { name: /התחל/ }).click();

  // Home
  await expect(page.getByRole("heading", { name: /שלום נועה/ })).toBeVisible();

  // Open topic practice
  await page.getByRole("link", { name: /תרגול לפי נושא/ }).click();
  await expect(page.getByRole("heading", { name: /בחרי נושא/ })).toBeVisible();

  // Pick "שברים עשרוניים"
  await page.getByRole("link", { name: /שברים עשרוניים/ }).first().click();

  // A question card and at least one option button render
  await expect(page.locator("section.card").first()).toBeVisible();
  const options = page.locator("button.card");
  expect(await options.count()).toBeGreaterThan(0);
});
