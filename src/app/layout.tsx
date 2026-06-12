import type { Metadata } from "next";
import "./original.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "8a0 — Oito a Zero",
  description: "Roll the dice, build your dream national team and win 8–0.",
  icons: {
    icon: [
      { url: "/vendor/8a0/favicon.ico" },
      { url: "/vendor/8a0/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="theme-panini __variable_ec6dc7 __variable_334670 __variable_4c2918 __variable_4b3a9b __variable_48cfcd __variable_bb2e19"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
