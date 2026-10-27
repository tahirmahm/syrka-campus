import { test, expect } from "@playwright/test";
test("Unconfigured deployment fails closed and preserves /cam routing", async ({
  page,
}) => {
  await page.goto("/cam/dashboard");
  await expect(page).toHaveURL(
    /^http:\/\/127\.0\.0\.1:3000\/cam\/login\?notice=setup$/,
  );
  await expect(
    page.getByRole("heading", { name: "Sign in to Campus" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "awaiting its dedicated backend",
  );
  const image = page.getByRole("img", { name: "Syrka", exact: true });
  await expect(image).toBeVisible();
  expect(
    await page.evaluate(async () => {
      const image = new Image();
      image.src = "/cam/brand/wordmark.jpg";
      await image.decode();
      return image.naturalWidth;
    }),
  ).toBeGreaterThan(0);
  for (const route of ["courses", "registration", "grades", "admin"]) {
    await page.goto(`/cam/${route}`);
    await expect(page).toHaveURL(
      /^http:\/\/127\.0\.0\.1:3000\/cam\/login(?:\?|$)/,
    );
  }
});
test("Login remains usable at a mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cam/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
