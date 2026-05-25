import { teamColor } from "@/lib/colors";
import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const SIZES = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
};

export function TeamAvatar({
  team,
  size = "md",
  className,
}: {
  team: Team | undefined;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (!team) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-400 ring-1 ring-inset ring-slate-200",
          SIZES[size],
          className,
        )}
        title="Unassigned"
      >
        ?
      </span>
    );
  }
  const color = teamColor(team.colorKey);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white",
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color.hex }}
      title={team.name}
    >
      {initials(team.name)}
    </span>
  );
}
