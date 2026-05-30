import {
  Award,
  ClipboardCheck,
  Clock,
  Feather,
  Home,
  Leaf,
  MapPin,
  Medal,
  Route,
  Sofa,
  Sparkle,
  Sparkles,
} from "lucide-react";
import type { IconName } from "@/lib/site";

const map: Record<IconName, React.ElementType> = {
  sofa: Sofa,
  sparkles: Sparkles,
  home: Home,
  award: Award,
  clock: Clock,
  medal: Medal,
  feather: Feather,
  leaf: Leaf,
  mapPin: MapPin,
  clipboardCheck: ClipboardCheck,
  route: Route,
  sparkle: Sparkle,
};

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Glyph = map[name];
  return <Glyph className={className} strokeWidth={1.6} aria-hidden />;
}
