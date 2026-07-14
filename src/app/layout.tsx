import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ferreteria Admin",
  description: "Panel administrativo web de Ferreteria.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
