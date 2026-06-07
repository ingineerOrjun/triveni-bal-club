import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next =
    sp.next && sp.next.startsWith("/") && !sp.next.startsWith("//")
      ? sp.next
      : "/portal";

  return (
    <>
      {sp.error === "inactive" ? (
        <div
          role="alert"
          className="mb-sp-3 rounded-md border border-warning/40 bg-warning-bg/50 px-3 py-2 text-caption text-gold-700"
        >
          Your account is inactive. Please contact a club administrator.
        </div>
      ) : null}
      <LoginForm next={next} />
    </>
  );
}
