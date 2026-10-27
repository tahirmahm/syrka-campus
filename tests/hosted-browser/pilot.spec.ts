import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
type User = { id: string; email: string; password: string };
const fixturePath = process.env.CAMPUS_TEST_FIXTURE_PATH;
if (!fixturePath)
  throw new Error(
    "Set CAMPUS_TEST_FIXTURE_PATH to the private hosted verification fixture",
  );
const fixture = JSON.parse(readFileSync(fixturePath, "utf8")) as {
  run: string;
  verified: boolean;
  users: Record<string, User>;
  enrolled_student: User;
  institutions: string[];
  offering: string;
};
const tenant = fixture.institutions[0];
async function login(page: Page, user: User) {
  await page.goto("/cam/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/cam\/dashboard$/);
}
function delivery(page: Page, name: string) {
  return page
    .locator("details")
    .filter({ has: page.locator("summary").getByText(name, { exact: true }) });
}
test("Hosted student, faculty and administrator journey through the real interface", async ({
  browser,
}) => {
  const runLabel = fixture.run + "-" + Date.now().toString(36);
  expect(fixture.verified).toBe(true);
  const adminContext = await browser.newContext();
  const facultyContext = await browser.newContext();
  const studentContext = await browser.newContext();
  const foreignContext = await browser.newContext();
  try {
    const admin = await adminContext.newPage(),
      faculty = await facultyContext.newPage(),
      student = await studentContext.newPage(),
      foreign = await foreignContext.newPage();
    await login(admin, fixture.users.admin);
    await admin.goto(`/cam/admin?institution=${tenant}`);
    await expect(
      admin.getByRole("heading", { name: "Enrollment oversight" }),
    ).toBeVisible();
    await expect(
      admin
        .getByRole("cell", { name: fixture.enrolled_student.id, exact: true })
        .first(),
    ).toBeVisible();
    const dept = delivery(admin, "Create department");
    await dept.locator("summary").click();
    await dept.locator('[name="name"]').fill(`Browser department ${runLabel}`);
    await dept.locator('[name="code"]').fill(`B${runLabel}`);
    await dept.getByRole("button", { name: "Create" }).click();
    await expect(admin.locator('select[name="department_id"]')).toContainText(
      `Browser department ${runLabel}`,
    );
    await login(faculty, fixture.users.faculty);
    await faculty.goto(
      `/cam/courses/${fixture.offering}?institution=${tenant}`,
    );
    const upload = delivery(faculty, "Upload syllabus or course material");
    await upload.locator("summary").click();
    await upload.locator('[name="title"]').fill(`Browser syllabus ${runLabel}`);
    await upload.locator('[name="file"]').setInputFiles({
      name: "syllabus.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% Browser verification\n%%EOF\n"),
    });
    await upload.locator('[name="published"]').check();
    await upload.getByRole("button", { name: "Upload" }).click();
    await expect(
      faculty.getByRole("link", { name: `Browser syllabus ${runLabel}` }),
    ).toBeVisible();
    const assignmentTitle = `Browser reflection ${runLabel}`;
    const assignment = delivery(faculty, "Add assignment");
    await assignment.locator("summary").click();
    await assignment.locator('[name="title"]').fill(assignmentTitle);
    await assignment
      .locator('[name="instructions"]')
      .fill("Discuss the syllabus and reading.");
    await assignment
      .locator('[name="due_at"]')
      .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await assignment.locator('[name="published"]').check();
    await assignment.getByRole("button", { name: "Create" }).click();
    await expect(
      faculty.getByRole("heading", { name: assignmentTitle }),
    ).toBeVisible();
    await login(student, fixture.enrolled_student);
    await student.goto(
      `/cam/courses/${fixture.offering}?institution=${tenant}`,
    );
    const work = student.locator("article").filter({
      has: student.getByRole("heading", {
        name: assignmentTitle,
        exact: true,
      }),
    });
    await work.locator('[name="body"]').fill("A thoughtful draft.");
    await work.getByRole("button", { name: "Save draft" }).click();
    await expect(work).toContainText(/Status:\s*draft/);
    await work
      .locator('[name="body"]')
      .fill("A considered final response to the reading.");
    await work.getByRole("button", { name: "Submit final" }).click();
    await expect(work).toContainText("submitted");
    expect(student.url()).not.toContain("/cam/cam");
    await faculty.reload();
    const review = faculty.locator("article").filter({
      has: faculty.getByRole("heading", {
        name: assignmentTitle,
        exact: true,
      }),
    });
    await review.locator("summary").click();
    await review.locator('[name="score"]').fill("88");
    await review.locator('[name="feedback"]').fill("Clear and well supported.");
    await Promise.all([
      faculty.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes("/cam/courses/"),
      ),
      review.getByRole("button", { name: "Save grade" }).click(),
    ]);
    await student.goto(`/cam/grades?institution=${tenant}`);
    await expect(
      student.getByRole("cell", { name: assignmentTitle, exact: true }),
    ).toHaveCount(0);
    await review.locator('[name="publish"]').check();
    await Promise.all([
      faculty.waitForResponse(
        (r) =>
          r.request().method() === "POST" && r.url().includes("/cam/courses/"),
      ),
      review.getByRole("button", { name: "Save grade" }).click(),
    ]);
    await student.reload();
    const row = student.getByRole("row").filter({ hasText: assignmentTitle });
    await expect(row).toContainText("88 / 100");
    await expect(row).toContainText("Clear and well supported.");
    await login(foreign, fixture.users.foreign_admin);
    await foreign.goto(
      `/cam/courses/${fixture.offering}?institution=${tenant}`,
    );
    await expect(
      foreign.getByRole("heading", { name: assignmentTitle, exact: true }),
    ).toHaveCount(0);
    await expect(foreign.locator("body")).not.toContainText(
      "A considered final response",
    );
    const authCookies = (await studentContext.cookies()).filter((c) =>
      c.name.startsWith("syrka-campus-auth"),
    );
    expect(authCookies.length).toBeGreaterThan(0);
    expect(authCookies.every((c) => c.path === "/cam")).toBe(true);
    await student.getByRole("button", { name: "Sign out" }).click();
    await expect(student).toHaveURL(/\/cam\/login$/);
  } finally {
    await Promise.all(
      [adminContext, facultyContext, studentContext, foreignContext].map((c) =>
        c.close(),
      ),
    );
  }
});

test("One-click demo access needs no email verification and stays in the demo institution", async ({
  browser,
}) => {
  for (const role of ["student", "faculty", "administrator"]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto("/cam/login");
      await page
        .getByRole("button", { name: `Explore as ${role}`, exact: false })
        .click();
      await expect(page).toHaveURL(/\/cam\/dashboard$/);
      await expect(page.getByRole("status")).toContainText(
        "DEMONSTRATION CAMPUS",
      );
      await expect(page.locator('select[name="institution"]')).toContainText(
        "Syrka Demonstration Campus",
      );
      await expect(
        page.locator('select[name="institution"]'),
      ).not.toContainText("Praxis Institute");
      if (role === "administrator") {
        await page.goto("/cam/admin");
        await expect(
          page.getByRole("heading", { name: "Academic configuration" }),
        ).toBeVisible();
      }
      if (role === "student") {
        await page.goto("/cam/grades");
        await expect(
          page.getByRole("heading", { name: "Final course results" }),
        ).toBeVisible();
        await expect(page.locator("main")).toContainText("84");
      }
    } finally {
      await context.close();
    }
  }
});
