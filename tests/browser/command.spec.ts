import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
// Vercel development identity is sent only to this Preview origin, never Workspace.
test.beforeEach(async ({ page, baseURL }) => {
  const token = process.env.VERCEL_OIDC_TOKEN;
  if (!token || !baseURL || !new URL(baseURL).hostname.endsWith(".vercel.app"))
    return;
  const origin = new URL(baseURL).origin;
  await page.route(`${origin}/**`, async (route) => {
    await route.continue({
      headers: {
        ...route.request().headers(),
        "x-vercel-trusted-oidc-idp-token": token,
      },
    });
  });
});
const output = process.env.CAMPUS_COMMAND_SCREENSHOTS;
async function capture(page: import("@playwright/test").Page, name: string) {
  if (output) {
    mkdirSync(output, { recursive: true });
    await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  }
}
test("Both remembered themes stay accessible without overflow", async ({
  page,
}) => {
  await page.goto("/cam/experience-demo");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const theme of ["dark", "light"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page.getByRole("button", { name: "Toggle colour theme" }).click();
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(
        page.getByRole("heading", { name: "Next up", exact: true }),
      ).toBeVisible();
      if (width === 390 || width === 1440) {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        ).toEqual([]);
        await capture(
          page,
          `${width === 390 ? "mobile" : "desktop"}-${theme}-dashboard`,
        );
      }
    }
  }
});

test("Assignment hand-off is navigation only and never claims submission", async ({
  page,
}) => {
  await page.goto("/cam/experience-demo");
  await page
    .getByRole("link", { name: "Continue assignment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Assignment workspace" }),
  ).toBeVisible();
  const write = page.getByRole("link", { name: /Open Write/ });
  await expect(write).toHaveAttribute(
    "href",
    "https://www.syrka.co/workspace?app=doc",
  );
  await write.click();
  await expect(page).toHaveURL("https://www.syrka.co/workspace?app=doc");
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Assignment workspace" }),
  ).toBeVisible();
  await expect(
    page.getByText(/create, attach or submit a document/i),
  ).toBeVisible();
});
test("Private fictional feedback requires confirmed association and reviewed proposals", async ({
  page,
}) => {
  await page.goto("/cam/experience-demo?view=correspondence");
  await expect(
    page.getByRole("button", { name: "Review revision task", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Associate with a course").selectOption("demo-data210");
  await expect(
    page.getByRole("alert").filter({ hasText: "does not match" }),
  ).toContainText("does not match");
  await expect(
    page.getByRole("button", { name: "Confirm course association" }),
  ).toBeDisabled();
  await page.getByLabel("Associate with a course").selectOption("demo-pol202");
  await page
    .getByRole("button", { name: "Confirm course association" })
    .click();
  await page
    .getByRole("button", { name: "Review revision task", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add personal revision task" })
    .click();
  await page
    .getByRole("button", { name: "Add personal revision task" })
    .click();
  await expect(
    page.getByText("One source-linked task exists.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Review Calendar proposal" }).click();
  await page.getByRole("button", { name: "Keep Calendar proposal" }).click();
  await page
    .getByLabel("Reply draft")
    .fill(
      "Thank you. I will clarify the limitations before the confirmed deadline.",
    );
  await page.getByRole("button", { name: "Review reply", exact: true }).click();
  await expect(page.getByText(/Mail hand-off unavailable/)).toBeVisible();
  await expect(
    page.getByText(/nothing was scheduled externally/),
  ).toBeVisible();
});
test("Completed evidence stays historical and Passport never becomes an automatic credential", async ({
  page,
}) => {
  await page.goto("/cam/experience-demo?view=progression");
  await page.getByRole("button", { name: "View supporting evidence" }).click();
  await page.getByRole("button", { name: "Inspect capability node" }).click();
  await expect(page.getByText(/Formal prerequisites/)).toBeVisible();
  await page.getByRole("button", { name: "Review next project" }).click();
  await page
    .getByLabel("Selected future goal")
    .selectOption("Archival research");
  await expect(page.getByText(/completed 20 June 2024/)).toBeVisible();
  await page.getByRole("button", { name: "Review for Passport" }).click();
  await expect(
    page.getByRole("button", { name: "Review evidence candidate" }),
  ).toBeDisabled();
  await page
    .getByLabel("I confirm ownership for this fictional review")
    .check();
  await page.getByRole("button", { name: "Review evidence candidate" }).click();
  await expect(page.getByText(/Passport hand-off unavailable/)).toBeVisible();
});
test("Fictional class preserves admission, publication and consent boundaries", async ({
  page,
}) => {
  await page.goto("/cam/experience-demo?view=class");
  await expect(
    page.getByRole("button", { name: "Join simulated class" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Simulate notes publication" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Request admission" }).click();
  await page.getByRole("button", { name: "Simulate host approval" }).click();
  await page.getByRole("button", { name: "Join simulated class" }).click();
  await expect(
    page.getByLabel("I consent to recording in this simulation"),
  ).not.toBeChecked();
  await page.getByLabel("I consent to recording in this simulation").check();
  await page.getByLabel("I consent to recording in this simulation").uncheck();
  await page
    .getByRole("button", { name: "Simulate notes publication" })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Separate evidence from interpretation",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/No transcript or private recording is exposed/),
  ).toBeVisible();
});

test("Every fictional journey is readable in both themes at narrow and desktop widths", async ({
  page,
  baseURL,
}) => {
  for (const width of [320, 1440])
    for (const theme of ["dark", "light"]) {
      await page.setViewportSize({ width, height: 960 });
      await page.context().addCookies([
        {
          name: "campus-appearance",
          value: theme,
          url: `${baseURL}/cam`,
        },
      ]);
      for (const view of [
        "course",
        "correspondence",
        "progression",
        "class",
        "evidence",
      ]) {
        await page.goto(`/cam/experience-demo?view=${view}`);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
          `${width} ${theme} ${view}`,
        ).toEqual([]);
        if (view === "course")
          await capture(
            page,
            `${width === 320 ? "mobile" : "desktop"}-${theme}-course`,
          );
      }
    }
});
