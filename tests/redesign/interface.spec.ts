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
  // Developer-owned strings are checked in ui-icons.test.ts; dynamic academic
  // content may legitimately contain emoji and must not be rejected here.
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
    await expect(course).toBeVisible();
    {
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
      await expect(course).toBeVisible();
      {
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

test("Unknown pages stay light under a dark system preference", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.emulateMedia({ colorScheme: "dark" });
  const response = await page.goto("/cam/unknown-redesign-check");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "We couldn’t find that page." }),
  ).toBeVisible();
  await clearLayout(page);
  await expect(
    page.getByRole("link", { name: "Return to Campus" }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

for (const role of ["student", "faculty", "administrator"]) {
  test(`Workspace is a same-tab SVG link in ${role} desktop and mobile navigation`, async ({
    page,
  }) => {
    await demo(page, role);
    for (const width of [1440, 320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      const mobile = width < 1024;
      if (mobile)
        await page.getByRole("button", { name: "Open navigation" }).click();
      const navigation = mobile
        ? page.getByRole("dialog", { name: "Campus navigation" })
        : page.getByRole("complementary", { name: "Campus sidebar" });
      const workspace = navigation.getByRole("link", {
        name: "Workspace",
        exact: true,
      });
      await expect(workspace).toBeVisible();
      await expect(workspace).toHaveAttribute(
        "href",
        "https://www.syrka.co/workspace",
      );
      expect(await workspace.getAttribute("target")).toBeNull();
      await expect(workspace.locator("svg")).toHaveAttribute(
        "stroke-width",
        "1.7",
      );
      await expect(workspace.locator("svg")).toHaveAttribute("width", "18");
      await expect(
        navigation.getByText("Syrka Apps", { exact: true }),
      ).toBeVisible();
      await clearLayout(page);
      await workspace.click();
      await expect(page).toHaveURL("https://www.syrka.co/workspace");
      await page.goto("/cam/dashboard");
      await expect(
        page.getByRole("heading", { name: "Dashboard", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("status", { name: "Demonstration environment" }),
      ).toBeVisible();
    }
  });
}
