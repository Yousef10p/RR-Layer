import { Suspense } from "react";
import "./ChartFrame.css";

/** Placeholder shown while the chart chunk loads. */
export function ChartSkeleton() {
  return <div className="chart-skeleton" aria-hidden="true" />;
}

/** Consistent titled container for every chart on the site. */
export default function ChartFrame({ title, subtitle, note, actions, children, height = 300 }) {
  return (
    <figure className="chart-frame glass">
      <figcaption className="chart-frame__head">
        <div>
          <h3 className="chart-frame__title">{title}</h3>
          {subtitle ? <p className="chart-frame__sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="chart-frame__actions">{actions}</div> : null}
      </figcaption>

      <div className="chart-frame__body" style={{ height }}>
        <Suspense fallback={<ChartSkeleton />}>{children}</Suspense>
      </div>

      {note ? <p className="chart-frame__note note">{note}</p> : null}
    </figure>
  );
}

/** Shared Recharts tooltip. `format` turns a numeric value into a string. */
export function ChartTooltip({ active, payload, label, labelPrefix = "", format }) {
  if (!active || !payload || !payload.length) return null;
  const fmt = format || ((v) => (typeof v === "number" ? v.toFixed(4) : v));

  return (
    <div className="chart-tooltip">
      {label !== undefined && label !== null ? (
        <div className="chart-tooltip__title">
          {labelPrefix}
          {label}
        </div>
      ) : null}
      {payload.map((entry) => (
        <div className="chart-tooltip__row" key={entry.dataKey ?? entry.name}>
          <span className="chart-tooltip__swatch" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="chart-tooltip__value">{fmt(entry.value, entry.payload)}</span>
        </div>
      ))}
    </div>
  );
}
