import {
  Award,
  PartyPopper,
  Users,
  Star,
  HandHeart,
  HeartHandshake,
  Crown,
  MessageSquare,
  ClipboardList,
  Trophy,
  Medal,
  Sparkles,
  Lightbulb,
  Rocket,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Map of badge `icon` strings (lucide names) to components. */
const ICONS: Record<string, LucideIcon> = {
  Award,
  PartyPopper,
  Users,
  Star,
  HandHeart,
  HeartHandshake,
  Crown,
  MessageSquare,
  ClipboardList,
  Trophy,
  Medal,
  Sparkles,
  Lightbulb,
  Rocket,
  ThumbsUp,
};

/** Renders a badge's lucide icon by name, falling back to Award. */
export function BadgeIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const Icon = (name && ICONS[name]) || Award;
  return <Icon className={cn("size-6", className)} aria-hidden />;
}
