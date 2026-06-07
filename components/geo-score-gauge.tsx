"use client";

import type { ScoreTier } from "@/lib/types/audit";

const TIER_ARC_COLOR: Record<ScoreTier, string> = {
  excellent: "#059669",
  good: "#3eb1f1",
  fair: "#ee810a",
  poor: "#f97316",
  critical: "#dc2626",
};

interface GeoScoreGaugeProps {
  score: number;
  tier: ScoreTier;
  size?: number;
}

/** Map score angle to SVG coords: 180° = left, 90° = top, 0° = right. */
function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy - radius * Math.sin(radians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`;
}

export function GeoScoreGauge({ score, tier, size = 220 }: GeoScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 16;
  const radius = (size - stroke * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const height = Math.round(size * 0.58);

  const startAngle = 180;
  const endAngle = 180 - (clamped / 100) * 180;
  const trackPath = describeArc(cx, cy, radius, startAngle, 0);
  const progressPath =
    clamped > 0 ? describeArc(cx, cy, radius, startAngle, endAngle) : "";

  const arcColor = TIER_ARC_COLOR[tier];

  return (
    <div className="relative mx-auto" style={{ width: size, height }}>
      <svg
        width={size}
        height={height}
        viewBox={`0 0 ${size} ${height}`}
        role="img"
        aria-label={`GEO score ${clamped} out of 100, ${tier}`}
      >
        <path
          d={trackPath}
          fill="none"
          stroke="#dce6f2"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {progressPath && (
          <path
            d={progressPath}
            fill="none"
            stroke={arcColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        )}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = 180 - (tick / 100) * 180;
          const inner = polarToCartesian(cx, cy, radius - stroke / 2 - 2, angle);
          const outer = polarToCartesian(cx, cy, radius + stroke / 2 + 2, angle);
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#c5d4e8"
              strokeWidth={tick % 50 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>
      <div
        className="absolute inset-x-0 flex flex-col items-center justify-end"
        style={{ bottom: 4 }}
      >
        <span className="text-5xl font-bold leading-none text-[#0b2a5b]">{clamped}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-[#49607e]">
          out of 100
        </span>
      </div>
    </div>
  );
}
