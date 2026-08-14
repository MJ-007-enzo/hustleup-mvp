import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ToastProvider";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "HustleUp",
  description:
    "Premium part-time job marketplace for students and local businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Navbar />
          {children}
          <Footer />
        </ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}