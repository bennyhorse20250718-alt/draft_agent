import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Draft Document AI Agent",
  description:
    "AI-powered drafting assistant for official replies and press releases",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-brand-900 text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Draft Document AI Agent
              </h1>
              <p className="text-brand-100 text-xs">
                Agentic RAG · Style-Matched Official Documents
              </p>
            </div>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-brand-200 transition-colors">
                ✍️ Draft
              </Link>
              <Link
                href="/admin"
                className="hover:text-brand-200 transition-colors"
              >
                📂 Manage Docs
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>

        <footer className="mt-16 border-t border-gray-200 py-6 text-center text-xs text-gray-400">
          Draft Document AI Agent · Built with FastAPI + Next.js + Qdrant + OpenAI
        </footer>
      </body>
    </html>
  );
}
