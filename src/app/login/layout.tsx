import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}
