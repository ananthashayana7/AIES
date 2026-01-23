import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cadence - Parametric Design Intelligence",
  description: "AI-augmented engineering design system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
