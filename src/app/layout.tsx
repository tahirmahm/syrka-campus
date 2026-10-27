import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Syrka Campus",
  description: "A considered space for academic life.",
  icons: { icon: "/cam/brand/symbol.jpg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
