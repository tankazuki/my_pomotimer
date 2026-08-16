import type { Metadata } from "next";
import { DotGothic16, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dotGothic16 = DotGothic16({
  variable: "--font-dotgothic16",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ポモドーロタイマー",
  description: "テーマを切り替えられるポモドーロタイマー & タスク管理",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} ${dotGothic16.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
