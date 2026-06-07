import Link from "next/link";
import { Palette, Type, Component, LayoutGrid, ArrowRight } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DsPageHeader, DsSection } from "./_components/showcase";

const SECTIONS = [
  {
    icon: Palette,
    title: "Colors",
    href: "/design-system/colors",
    desc: "Brand palette, semantic tokens, and the accessibility contract.",
  },
  {
    icon: Type,
    title: "Typography",
    href: "/design-system/typography",
    desc: "Fluid type scale across Bricolage, Jakarta, and Devanagari.",
  },
  {
    icon: Component,
    title: "Components",
    href: "/design-system/components",
    desc: "Buttons, forms, overlays, navigation, and data display.",
  },
  {
    icon: LayoutGrid,
    title: "Layout",
    href: "/design-system/layout",
    desc: "Spacing, radius, elevation, and motion system.",
  },
];

export default function DesignSystemOverview() {
  return (
    <>
      <DsPageHeader
        title="Triveni Design System"
        lead="A Civic-Optimist foundation: inspiring, student-led, modern, and trustworthy. Every screen in the portal is built from these tokens and components."
      />

      <DsSection
        title="Principles"
        description="What the system optimizes for."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Inspiring</Badge>
          <Badge variant="accent">Energetic</Badge>
          <Badge variant="soft">Student-Led</Badge>
          <Badge variant="neutral">Trustworthy</Badge>
          <Badge variant="outline">Accessible (WCAG AA)</Badge>
          <Badge variant="outline">Bilingual-ready</Badge>
        </div>
      </DsSection>

      <DsSection title="Explore">
        <div className="grid gap-sp-3 sm:grid-cols-2">
          {SECTIONS.map(({ icon: Icon, title, href, desc }) => (
            <Link key={href} href={href} className="group rounded-lg">
              <Card interactive className="h-full">
                <CardHeader>
                  <span className="mb-sp-1 inline-flex size-11 items-center justify-center rounded-md bg-primary-soft text-primary-active">
                    <Icon className="size-5" />
                  </span>
                  <CardTitle className="flex items-center gap-1">
                    {title}
                    <ArrowRight className="size-4 text-soft transition-transform duration-fast group-hover:translate-x-1" />
                  </CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </DsSection>

      <DsSection
        title="Token architecture"
        description="Three layers keep the system flexible and themeable."
      >
        <Card>
          <CardContent className="grid gap-sp-3 pt-sp-3 sm:grid-cols-3">
            <div>
              <p className="font-heading font-bold text-ink">1 · Raw</p>
              <p className="text-body text-soft">
                Brand palette &amp; primitive scales — the ingredients.
              </p>
            </div>
            <div>
              <p className="font-heading font-bold text-ink">2 · Semantic</p>
              <p className="text-body text-soft">
                Meaning-based aliases components use:{" "}
                <code className="text-caption">--bg</code>,{" "}
                <code className="text-caption">--ink</code>,{" "}
                <code className="text-caption">--primary</code>.
              </p>
            </div>
            <div>
              <p className="font-heading font-bold text-ink">3 · System</p>
              <p className="text-body text-soft">
                Spacing, radius, elevation, motion, and type scale.
              </p>
            </div>
          </CardContent>
        </Card>
      </DsSection>
    </>
  );
}
