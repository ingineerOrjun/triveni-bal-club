import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

/** Shared shell for all public-facing pages: sticky nav + footer. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
