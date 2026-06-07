import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="container-page flex flex-1 flex-col items-center justify-center gap-sp-3 py-sp-6 text-center">
        <p className="font-display text-display font-extrabold text-primary-active">
          404
        </p>
        <h1 className="text-h2 font-bold text-ink">Page not found</h1>
        <p className="max-w-md text-lead text-soft">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Button asChild variant="primary" size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </main>
      <Footer />
    </div>
  );
}
