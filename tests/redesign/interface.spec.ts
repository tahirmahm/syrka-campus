import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
const widths = [320, 375, 390, 430, 768, 1024, 1440];
const screenshots = process.env.CAMPUS_SCREENSHOT_DIR;
if (screenshots) mkdirSync(screenshots, { recursive: true });
async function snapshot(page: Page, name: string) {
  if (screenshots)
    await page.screenshot({
      path: `${screenshots}/${name}.png`,
      fullPage: true,
      caret: "initial",
    });
}
async function clearLayout(page: Page) {
  await expect(
    page.getByRole("button", { name: /dark appearance|light appearance/i }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
  ).toBe("rgb(250, 250, 248)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/[↗→←↓◐]|\p{Extended_Pictographic}/u);
}
async function demo(page: Page, role: string) {
  await page.goto("/cam/login");
  await page.getByRole("button", { name: `Explore as ${role}` }).click();
  await expect(page).toHaveURL(/\/cam\/dashboard$/);
}
for (const width of widths) {
  test(`Student destinations remain light, readable and within ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("campus-theme", "dark");
      localStorage.setItem("theme", "dark");
    });
    await page.goto("/cam/login");
    await expect(
      page.getByRole("heading", { name: "Sign in to Campus" }),
    ).toBeVisible();
    await clearLayout(page);
    if (width === 1440 || width === 390)
      await snapshot(page, `${width === 1440 ? "desktop" : "mobile"}-login`);
    await demo(page, "student");
    const failures: string[] = [];
    page.on("pageerror", (e) => failures.push(e.message));
    for (const route of [
      "dashboard",
      "my-courses",
      "courses",
      "assignments",
      "assessments",
      "registration",
      "grades",
      "calendar",
    ]) {
      await page.goto(`/cam/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "We couldn’t complete that request.",
        }),
      ).toHaveCount(0);
      await clearLayout(page);
      if (
        (width === 1440 || width === 390) &&
        ["dashboard", "courses", "grades", "calendar", "registration"].includes(
          route,
        )
      )
        await snapshot(
          page,
          `${width === 1440 ? "desktop" : "mobile"}-${route}`,
        );
    }
    await page.goto("/cam/my-courses");
    const course = page.getByRole("link", { name: "Open course" }).first();
    if (await course.count()) {
      await course.click();
      await expect(
        page.getByRole("navigation", { name: "Course navigation" }),
      ).toBeVisible();
      await clearLayout(page);
      if (width === 1440 || width === 390)
        await snapshot(page, `${width === 1440 ? "desktop" : "mobile"}-course`);
      await page.getByRole("link", { name: "Modules", exact: true }).click();
      await expect(
        page.getByRole("link", { name: "Modules", exact: true }),
      ).toHaveAttribute("aria-current", "location");
      await page
        .getByRole("link", { name: "Grades & records", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Academic records", exact: true }),
      ).toBeVisible();
      await clearLayout(page);
    }
    await page.goto("/cam/assessments");
    const assessment = page
      .getByRole("link", { name: /^Open assessment / })
      .first();
    if (await assessment.count()) {
      await assessment.click();
      await expect(page.locator("h1")).toBeVisible();
      await clearLayout(page);
    }
    expect(failures).toEqual([]);
  });
}
test("Mobile navigation traps focus, closes with Escape and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await demo(page, "student");
  const open = page.getByRole("button", { name: "Open navigation" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Campus navigation" });
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 22; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await snapshot(page, "mobile-navigation");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(open).toBeFocused();
  await open.click();
  await dialog.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/\/cam\/calendar(?:\?|$)/);
  await expect(
    page.getByRole("heading", { name: "Calendar", exact: true }),
  ).toBeVisible();
});
test("Withdrawal confirmation can be cancelled without changing academic data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await demo(page, "student");
  await page.goto("/cam/registration");
  const withdraw = page
    .getByRole("button", { name: "Withdraw", exact: true })
    .first();
  if (await withdraw.count()) {
    await withdraw.click();
    const dialog = page.getByRole("dialog", {
      name: "Withdraw from this course?",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Keep registration" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(withdraw).toBeVisible();
  }
});
for (const role of ["faculty", "administrator"]) {
  test(`${role} tools use the same accessible desktop and mobile system`, async ({
    page,
  }) => {
    await demo(page, role);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      if (width === 1440) {
        const nav = page.getByRole("navigation", { name: "Main navigation" });
        await expect(
          nav.getByRole("link", { name: "Registration", exact: true }),
        ).toHaveCount(0);
      }
      for (const route of [
        "dashboard",
        "my-courses",
        "assignments",
        "assessments",
        "grades",
        "calendar",
        ...(role === "administrator" ? ["admin"] : []),
      ]) {
        await page.goto(`/cam/${route}`);
        await expect(page.locator("h1")).toBeVisible();
        await clearLayout(page);
      }
      if (role === "administrator") {
        for (const summary of await page
          .locator("main details > summary")
          .all())
          await summary.click();
        await clearLayout(page);
        await snapshot(
          page,
          `${width === 1440 ? "desktop" : "mobile"}-administration`,
        );
      }
      await page.goto("/cam/my-courses");
      const course = page.getByRole("link", { name: "Open course" }).first();
      if (await course.count()) {
        await course.click();
        await expect(
          page.getByRole("heading", { name: "Teaching desk" }),
        ).toBeVisible();
        for (const summary of await page
          .locator("#teaching details > summary")
          .all())
          await summary.click();
        await clearLayout(page);
        await snapshot(
          page,
          `${width === 1440 ? "desktop" : "mobile"}-${role}-course`,
        );
        await page.getByRole("link", { name: "Grades & records" }).click();
        for (const summary of await page
          .locator("main details > summary")
          .all())
          await summary.click();
        await clearLayout(page);
      }
    }
  });
}

test("Representative light pages pass automated WCAG A/AA checks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  async function scan() {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  }
  await page.goto("/cam/login");
  await scan();
  await demo(page, "student");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  for (const route of [
    "dashboard",
    "courses",
    "registration",
    "grades",
    "assignments",
    "assessments",
    "calendar",
  ]) {
    await page.goto(`/cam/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    await scan();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("dialog", { name: "Campus navigation" }),
  ).toBeVisible();
  await scan();
  await page.keyboard.press("Escape");
});
