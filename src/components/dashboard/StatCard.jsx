import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const DOTS = [
  [14, 14, "0.54s"],
  [38, 14, "0.36s"],
  [62, 14, "0.18s"],
  [86, 14, "0s"],
  [38, 38, "0.54s"],
  [62, 38, "0.36s"],
  [86, 38, "0.18s"],
  [62, 62, "0.54s"],
  [86, 62, "0.36s"],
  [86, 86, "0.54s"],
];

function formatNumber(value, decimals) {
  return (Number(value) || 0).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Soft control card: title + descending dot accent, then a large metric with
 * two supporting label/value pairs. Restyled for LoneStar WorkLog.
 */
export default function StatCard({
  title,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  details = [],
  hint,
  className,
}) {
  const grainId = `grain-${useId().replace(/[:]/g, "")}`;
  const ref = useRef(null);
  const [display, setDisplay] = useState(0);
  const target = Number(value) || 0;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(target);
      return;
    }
    let frame = 0;
    let start = 0;
    const duration = 1200;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
      else setDisplay(target);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  const finalString = `${prefix}${formatNumber(target, decimals)}${suffix}`;
  const size =
    finalString.length > 8
      ? "text-[clamp(1.9rem,7vw,2.6rem)]"
      : finalString.length > 5
        ? "text-[clamp(2.2rem,8vw,3.1rem)]"
        : "text-[clamp(2.4rem,9vw,3.4rem)]";

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex min-h-[11.5rem] flex-col justify-between gap-6 overflow-hidden rounded-[1.6rem] border border-[#E3DFD1] bg-[#F1EEE4] p-5 text-[#1B1B18] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_18px_40px_-28px_rgba(28,22,10,0.45)] sm:p-6",
        className,
      )}
      style={{
        backgroundImage:
          "radial-gradient(125% 125% at 100% 0%, rgba(176,69,27,0.34) 0%, rgba(176,69,27,0.13) 32%, rgba(176,69,27,0) 64%)",
      }}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50 mix-blend-overlay"
        style={{
          maskImage: "radial-gradient(125% 125% at 100% 0%, black 0%, black 22%, transparent 72%)",
          WebkitMaskImage:
            "radial-gradient(125% 125% at 100% 0%, black 0%, black 22%, transparent 72%)",
        }}
      >
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.25" intercept="-0.12" />
            <feFuncG type="linear" slope="1.25" intercept="-0.12" />
            <feFuncB type="linear" slope="1.25" intercept="-0.12" />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[1.05rem] font-medium leading-snug tracking-tight text-[#1B1B18]">
            {title}
          </h3>
          {hint ? <p className="mt-1 text-[0.72rem] text-[#6E6A5C]">{hint}</p> : null}
        </div>
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          className="h-10 w-10 shrink-0 fill-[#B0451B] sm:h-12 sm:w-12"
        >
          {DOTS.map(([cx, cy, delay]) => (
            <circle key={`${cx}-${cy}`} className="stat-dot" cx={cx} cy={cy} r="9" style={{ "--d": delay }} />
          ))}
        </svg>
      </div>

      <div className="relative flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <p className={cn("tabular font-semibold leading-none tracking-[-0.03em]", size)}>
          {prefix}
          {formatNumber(display, decimals)}
          {suffix}
        </p>
        {details.length > 0 && (
          <dl className="flex flex-wrap gap-x-6 gap-y-2">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-[0.72rem] text-[#6E6A5C]">{detail.label}</dt>
                <dd className="tabular text-[0.85rem] font-medium text-[#1B1B18]">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}