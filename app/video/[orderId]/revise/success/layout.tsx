import { Suspense } from "react";

export default function RevisionSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
