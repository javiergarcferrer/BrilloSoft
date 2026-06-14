import {
  Armchair,
  Briefcase,
  Cpu,
  HardHat,
  HeartPulse,
  Paperclip,
  ShieldCheck,
  Shirt,
  Sparkles,
  Truck,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Maps the category `icon` names in data.ts to lucide components. */
const MAP: Record<string, LucideIcon> = {
  HardHat,
  Sparkles,
  Cpu,
  HeartPulse,
  Armchair,
  UtensilsCrossed,
  Truck,
  Briefcase,
  Zap,
  Paperclip,
  Shirt,
  ShieldCheck,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = MAP[name] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}
