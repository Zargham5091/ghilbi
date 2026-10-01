import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "2周年記念 · Work Anniversary",
  description: "A Ghibli / lofi styled work anniversary journey.",
};

export const viewport: Viewport = { themeColor: "#14101f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
