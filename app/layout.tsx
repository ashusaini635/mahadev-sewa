import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { InactivityTracker } from "@/components/InactivityTracker";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mahadev Seva — Committee Fund Tracker",
  description: "Monthly fund collection tracker for Mahashivratri committee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <SessionProvider>
          <InactivityTracker />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

