import { Metadata } from "next";

export const metadata: Metadata = {
  robots: "index, follow",
};

export default function PropertyWebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
