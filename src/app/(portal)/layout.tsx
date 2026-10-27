import { session } from "@/lib/session";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export default async function Portal({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, memberships, membership } = await session();
  return (
    <Shell
      memberships={memberships}
      email={user.email ?? "Campus account"}
      defaultInstitution={membership?.institution_id}
      demoInstitution={process.env.CAMPUS_DEMO_INSTITUTION_ID}
    >
      {children}
    </Shell>
  );
}
