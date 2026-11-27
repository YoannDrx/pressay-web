import { Fragment, type CSSProperties } from "react";

/** A keyboard shortcut as nested <kbd> keycaps, e.g. ["Ctrl", "Win"]. */
export function Keys({ keys, className = "" }: { keys: readonly string[]; className?: string }) {
  return (
    <kbd className={`keys ${className}`.trim()}>
      {keys.map((key, index) => (
        <Fragment key={key}>
          {index > 0 ? <span aria-hidden="true">+</span> : null}
          <kbd className="key">{key}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}

const waveHeights = [22, 38, 64, 46, 82, 58, 94, 50, 72, 34, 78, 96, 62, 40, 74, 52, 86, 60, 30, 66, 44, 80, 54, 36, 70, 48, 88, 42];

/** Decorative voice waveform; `count` bars spread across the brand spectrum. */
export function Wave({ count = 20, className = "" }: { count?: number; className?: string }) {
  return (
    <span className={`wave ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ "--h": `${waveHeights[index % waveHeights.length]}%`, "--x": `${(index / Math.max(1, count - 1)) * 100}%`, "--i": index } as CSSProperties} />
      ))}
    </span>
  );
}
