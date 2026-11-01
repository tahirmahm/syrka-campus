import { AcademicExperience } from "@/components/command/experience";
export const metadata = {
  title: "Academic experience · fictional walkthrough · Syrka Campus",
  robots: { index: false, follow: false },
};
export default async function ExperienceDemo({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; task?: string }>;
}) {
  const query = await searchParams;
  return (
    <AcademicExperience initialView={query.view} initialTask={query.task} />
  );
}
