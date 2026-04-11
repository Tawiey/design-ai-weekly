import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Design × AI Weekly",
  description:
    "A curated weekly digest of the most important news at the intersection of design and artificial intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
    >
      <body className="bg-neutral-950 text-neutral-100 font-sans min-h-screen">
        <header className="border-b border-neutral-800">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <a
              href="/"
              className="text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              Design × AI Weekly
            </a>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-10">{children}</main>
        <footer className="border-t border-neutral-800 mt-16">
          <div className="max-w-2xl mx-auto px-6 py-6">
            <p className="text-xs text-neutral-600">
              Curated weekly. Powered by Notion + Next.js.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
