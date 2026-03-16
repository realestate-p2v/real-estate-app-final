import { Suspense } from "react";

export default function DashboardRevisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
