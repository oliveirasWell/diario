import { expect, test } from "@playwright/test";
import { MAPA_PATH, MAP_COPY } from "../lib/mapa/constants";

test("map page opens and a room click opens the panel", async ({ page }) => {
  await page.goto(MAPA_PATH);
  await expect(page.getByRole("link", { name: MAP_COPY.navMapa })).toBeVisible();
  await page.locator('[data-location-code="07"]').click();
  await expect(page.getByRole("heading", { name: "Sala 07" })).toBeVisible();
  await expect(page.getByRole("button", { name: MAP_COPY.howToGetHere })).toBeVisible();
  await expect(page.getByLabel(MAP_COPY.gradeLabel, { exact: true })).toBeVisible();
  await expect(page.getByLabel(MAP_COPY.sectionLabel, { exact: true })).toBeVisible();
});

test("search highlights a location before the panel opens", async ({ page }) => {
  await page.goto(MAPA_PATH);
  await page.getByLabel(MAP_COPY.searchPlaceholder).fill("biblioteca");
  await page
    .getByRole("button", { name: /Biblioteca/ })
    .first()
    .click();
  await expect(page.getByText(MAP_COPY.searchToast("Biblioteca"))).toBeVisible();
  await page.locator('[data-location-code="biblioteca"]').click();
  await expect(page.getByRole("button", { name: MAP_COPY.howToGetHere })).toBeVisible();
});
