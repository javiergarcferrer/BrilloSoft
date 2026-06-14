import { cn } from "@/lib/utils";
import { nivelAfinidad } from "@/lib/licitaciones/utils";

/**
 * Circular affinity gauge (0-100). Pure SVG — the ring color tracks the
 * affinity level (high / medium / low).
 */
export function ScoreRing({
  score,
  size = 44,
  stroke = 4,
  showLabel = true,
  className,
}: {
  score: number;
  size?: number;
  stroke?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const nivel = nivelAfinidad(score);

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      title={`${nivel.label} · ${score}/100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-hairline"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={nivel.ring}
        />
      </svg>
      {showLabel && (
        <span
          className={cn("absolute font-semibold tabular-nums", nivel.color)}
          style={{ fontSize: size * 0.3 }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
