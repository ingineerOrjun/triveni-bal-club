import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { SITE } from "@/content/site";
import { ToastProvider } from "@/components/ui/toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline.en}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description.en,
  applicationName: "Triveni Child Club Portal",
  authors: [{ name: SITE.name }],
  keywords: ["Triveni", "Child Club", "school", "students", "Nepal", SITE.school],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    title: `${SITE.name} — ${SITE.tagline.en}`,
    description: SITE.description.en,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#070B16" },
  ],
};

/**
 * Sets the persisted (or system) theme on <html> before first paint, so dark
 * mode never flashes. Mirrors the logic in <ThemeToggle/>.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body
        className="min-h-dvh bg-background text-ink antialiased"
        suppressHydrationWarning
      >
        {/* Pre-paint theme application (no FOUC). Placed first in <body> rather
            than in a manual <head> so it doesn't desync App Router head hydration. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
