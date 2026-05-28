import {
  Sofa,
  Wind,
  Trees,
  ChefHat,
  Building2,
  Droplets,
  Search,
  ClipboardCheck,
  Sparkles,
  Leaf,
  ShieldCheck,
} from "lucide-react";

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

/** Map of icon keys used in `src/lib/site.ts` data to lucide components. */
export const ICONS: Record<string, IconComponent> = {
  Sofa,
  Wind,
  Trees,
  ChefHat,
  Building2,
  Droplets,
  Search,
  ClipboardCheck,
  Sparkles,
  Leaf,
  ShieldCheck,
};
