import { test, expect } from "@playwright/test";
test("Unconfigured deployment fails closed and preserves /campus routing", async ({
  page,
}) => {
  await page.goto("/campus/dashboard");
  await expect(page).toHaveURL(
    /^http:\/\/127\.0\.0\.1:3000\/campus\/login\?notice=setup$/,
  );
  await expect(
    page.getByRole("heading", { name: "Continue your journey." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "awaiting its dedicated backend",
  );
  const image = page.getByRole("img", { name: "Syrka", exact: true });
  await expect(image).toBeVisible();
  expect(
    await image.evaluate((el: HTMLImageElement) => el.naturalWidth),
  ).toBeGreaterThan(0);
  for (const route of ["courses", "registration", "grades", "admin"]) {
    await page.goto(`/campus/${route}`);
    await expect(page).toHaveURL(
      /^http:\/\/127\.0\.0\.1:3000\/campus\/login(?:\?|$)/,
    );
  }
});
test("Login remains usable at a mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/campus/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
