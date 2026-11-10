import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoCheck — um olhar de fora para o teu repositório",
  description:
    "Descobre como tornar o teu repositório GitHub mais fácil de explorar, executar e receber contribuições. Verificações com evidências e próximos passos.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
