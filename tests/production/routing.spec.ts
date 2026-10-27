import { test, expect } from "@playwright/test";
test("Canonical Campus proxy serves login and its real assets", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.url().startsWith("https://www.syrka.co/cam/") && r.status() >= 400)
      failures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/cam/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to Campus" }),
  ).toBeVisible();
  const logo = page.getByRole("img", { name: "Syrka", exact: true });
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((el) => getComputedStyle(el).maskImage)).toContain(
    "wordmark.jpg",
  );
  expect(
    await page.evaluate(async () => {
      const image = new Image();
      image.src = "/cam/brand/wordmark.jpg";
      await image.decode();
      return image.naturalWidth;
    }),
  ).toBeGreaterThan(0);
  expect(failures).toEqual([]);
  await page.screenshot({
    path: "test-results/production-cam.png",
    fullPage: true,
  });
});
test("Direct routes and refresh preserve the /cam prefix once", async ({
  page,
}) => {
  for (const route of [
    "",
    "/dashboard",
    "/courses",
    "/registration",
    "/grades",
    "/admin",
  ]) {
    await page.goto(`/cam${route}`);
    await expect(page).toHaveURL(
      /^https:\/\/www\.syrka\.co\/cam\/login(?:\?|$)/,
    );
    await page.reload();
    await expect(page.getByLabel("Email address")).toBeVisible();
    expect(page.url()).not.toContain("/cam/cam");
  }
});
test("Public login fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/cam/login");
  await expect(page.getByLabel("Email address")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("Existing Syrka routes remain available", async ({ page }) => {
  for (const path of ["/", "/workspace", "/workspace/tools"]) {
    const r = await page.goto(path);
    expect(r?.status(), path).toBe(200);
    expect(page.url()).not.toContain("/cam");
  }
});
