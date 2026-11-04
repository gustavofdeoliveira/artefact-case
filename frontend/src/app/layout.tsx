import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Simple task manager built with Next.js and tRPC",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link href="/" className="brand">
            Tasks
          </Link>
          <Link href="/tasks/new" className="button">
            + New task
          </Link>
        </header>
        <main className="content">
          <TRPCProvider>{children}</TRPCProvider>
        </main>
      </body>
    </html>
  );
}
