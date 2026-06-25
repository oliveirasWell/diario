import { expect, test } from "@playwright/test";

test("login page shows Google sign in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
});
