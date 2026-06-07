import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { localize } from "@/lib/i18n";
import { SITE, CONTACT } from "@/content/site";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HeroSection } from "@/components/sections/hero-section";
import { ContactForm } from "@/components/forms/contact-form";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";

export const metadata = createMetadata({
  title: "Contact",
  description: `Get in touch with the ${SITE.name} at ${SITE.school}.`,
  path: "/contact",
});

const DETAILS = [
  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  { icon: Phone, label: "Phone", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
  { icon: MapPin, label: "Address", value: localize(CONTACT.address) },
  { icon: Clock, label: "Hours", value: localize(CONTACT.hours) },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <HeroSection
        eyebrow={<Badge variant="soft">Say hello</Badge>}
        title="Contact us"
        description="Questions, ideas, or want to get involved? We'd love to hear from you."
      />

      <section className="container-page py-sp-5">
        <div className="grid gap-sp-4 lg:grid-cols-[1fr_1.3fr]">
          {/* Details */}
          <div className="flex flex-col gap-sp-3">
            <h2 className="text-h2 font-bold text-ink">Get in touch</h2>
            <ul className="flex flex-col gap-sp-2">
              {DETAILS.map((d) => {
                const Icon = d.icon;
                return (
                  <li key={d.label}>
                    <Card className="flex items-start gap-sp-2 p-sp-3">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-caption font-semibold uppercase tracking-wide text-soft">
                          {d.label}
                        </p>
                        {d.href ? (
                          <a
                            href={d.href}
                            className="break-words text-body font-semibold text-ink hover:text-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            {d.value}
                          </a>
                        ) : (
                          <p className="break-words text-body font-semibold text-ink">
                            {d.value}
                          </p>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>

            {/* Map placeholder */}
            <div
              role="img"
              aria-label="Map showing the school location (placeholder)"
              className="relative flex h-56 items-center justify-center overflow-hidden rounded-lg border border-line bg-background-subtle"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(var(--slate-200)_1px,transparent_1px),linear-gradient(90deg,var(--slate-200)_1px,transparent_1px)] [background-size:24px_24px] opacity-60"
              />
              <div className="relative flex flex-col items-center gap-1 text-center">
                <MapPin className="size-8 text-primary-active" />
                <p className="font-heading font-bold text-ink">
                  {SITE.school}
                </p>
                <p className="text-caption text-soft">Map integration coming soon</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="p-sp-4">
            <h2 className="mb-sp-3 text-h2 font-bold text-ink">Send a message</h2>
            <ContactForm />
          </Card>
        </div>
      </section>
    </>
  );
}
