import { session } from "@/lib/session";
import { loadCommand } from "@/lib/command/load";
import { CommandDashboard } from "@/components/command/dashboard";
import StaffDashboard from "@/components/staff-dashboard";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ institution?: string }>;
}) {
  const { institution } = await searchParams;
  const context = await session(institution);
  if (context.membership?.role !== "student")
    return <StaffDashboard searchParams={Promise.resolve({ institution })} />;
  return <CommandDashboard data={await loadCommand(context)} />;
}
