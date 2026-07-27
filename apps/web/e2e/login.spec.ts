import { expect, test } from "@playwright/test";

test("login page shows Google sign in", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
});

test("protected pages redirect anonymous users to login", async ({ page }) => {
  await page.goto("/classes");
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fclasses$/);
  await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
});
