export const CHART = {
  brand: "#465fff",
  green: "#12b76a",
  greenDark: "#039855",
  orange: "#f79009",
  red: "#f04438",
  navy: "#344054",
  light: "#9cb9ff",
  grid: "#e4e7ec",
  axis: "#667085",
};

export function makeAxisStyle(theme) {
  return {
    tick: { fill: theme.axis, fontSize: 12 },
    axisLine: { stroke: theme.grid },
    tickLine: false,
  };
}

export function Tooltip({ active, payload, label, unit = " µg/m³", labelFmt }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-card-lg dark:border-gray-700 dark:bg-gray-800">
      {label != null && (
        <p className="mb-1 font-medium text-gray-700 dark:text-gray-200">
          {labelFmt ? labelFmt(label) : label}
        </p>
      )}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span>{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-white">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">
      Memuat data…
    </div>
  );
}

export function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-error-500/30 bg-error-50 px-4 py-3 text-sm text-error-700 dark:bg-error-500/10 dark:text-error-500">
      {message}
    </div>
  );
}
