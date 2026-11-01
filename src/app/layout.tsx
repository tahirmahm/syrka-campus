import type { Metadata } from "next";
import "./globals.css";
import { cookies } from "next/headers";
import { ThemeToggle } from "@/components/theme";
export const metadata: Metadata = {
  title: "Syrka Campus",
  description: "A considered space for academic life.",
  icons: { icon: "/cam/brand/symbol.jpg" },
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme =
    (await cookies()).get("campus-appearance")?.value === "light"
      ? "light"
      : "dark";
  return (
    <html lang="en" data-theme={theme} style={{ colorScheme: theme }}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
        <div className="auth-appearance">
          <ThemeToggle initialTheme={theme} />
        </div>
      </body>
    </html>
  );
}
