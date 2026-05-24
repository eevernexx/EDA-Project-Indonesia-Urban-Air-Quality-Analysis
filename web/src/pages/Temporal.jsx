import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip as RTooltip,
} from "recharts";
import { useData, rollingMean } from "../lib/data.js";
import { useChartTheme } from "../lib/theme.jsx";
import { PageHeader, ChartCard, Card } from "../components/ui.jsx";
import { CHART, makeAxisStyle, Tooltip, Loading, ErrorBox } from "../components/chart.jsx";

const WINDOWS = [7, 14, 30, 60, 90];

// Nilai rendah = hijau, tinggi = merah.
function heatColor(v) {
  if (v == null) return "#f2f4f7";
  const stops = [
    [0, [26, 152, 80]],
    [20, [166, 217, 106]],
    [30, [255, 255, 191]],
    [40, [253, 174, 97]],
    [60, [215, 48, 39]],
  ];
  const x = Math.max(0, Math.min(60, v));
  for (let i = 1; i < stops.length; i++) {
    if (x <= stops[i][0]) {
      const [x0, c0] = stops[i - 1];
      const [x1, c1] = stops[i];
      const t = (x - x0) / (x1 - x0);
      const c = c0.map((ch, k) => Math.round(ch + (c1[k] - ch) * t));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  return "rgb(215,48,39)";
}

export default function Temporal() {
  const { data, error } = useData("temporal");
  const [win, setWin] = useState(30);
  const theme = useChartTheme();
  const axisStyle = makeAxisStyle(theme);

  const series = useMemo(() => {
    if (!data) return [];
    const vals = data.series.map((d) => d.pm25);
    const roll = rollingMean(vals, win);
    return data.series.map((d, i) => ({ ...d, rolling: roll[i] }));
  }, [data, win]);

  const fmtDate = (s) => {
    const d = new Date(s);
    return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
  };

  return (
    <div>
      <PageHeader
        title="Polusi dari Waktu ke Waktu"
        subtitle="Polusi udara harian, dengan garis rata-rata yang dihaluskan dan masa lockdown COVID yang ditandai."
      />

      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <ChartCard
            title="Polusi Udara Harian"
            subtitle={`Bacaan tiap hari, plus garis rata-rata ${win} hari · area berwarna = masa lockdown`}
            action={
              <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWin(w)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      win === w
                        ? "bg-white text-brand-600 shadow-sm dark:bg-gray-700 dark:text-brand-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    {w} hr
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    {...axisStyle}
                    tickFormatter={fmtDate}
                    minTickGap={48}
                  />
                  <YAxis {...axisStyle} />
                  <RTooltip content={<Tooltip labelFmt={(l) => new Date(l).toLocaleDateString("id-ID")} />} />
                  {data.psbb_periods.map((p) => (
                    <ReferenceArea
                      key={p.start}
                      x1={p.start}
                      x2={p.end}
                      fill={p.kind === "strict" ? CHART.red : CHART.orange}
                      fillOpacity={0.1}
                      ifOverflow="extendDomain"
                    />
                  ))}
                  <ReferenceLine
                    y={data.who.h24}
                    stroke={CHART.red}
                    strokeDasharray="6 4"
                    label={{ value: "Batas aman", position: "insideTopRight", fill: CHART.red, fontSize: 11 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pm25"
                    name="Tingkat harian"
                    stroke={CHART.light}
                    strokeWidth={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="rolling"
                    name={`Rata-rata ${win} hari`}
                    stroke={theme.label}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <LegendDot color={CHART.light} label="Tingkat harian" />
              <LegendDot color={theme.label} label={`Rata-rata ${win} hari`} />
              <LegendDot color={CHART.red} label="Lockdown ketat" />
              <LegendDot color={CHART.orange} label="Lockdown longgar" />
            </div>
          </ChartCard>

          <Card className="mt-6 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Polusi per Bulan</h3>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              Rata-rata polusi tiap bulan — makin merah berarti udara makin kotor
            </p>
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[48px_repeat(12,1fr)] gap-1">
                  <div />
                  {data.heatmap.months.map((m) => (
                    <div key={m} className="pb-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                      {m}
                    </div>
                  ))}
                  {data.heatmap.rows.map((row) => (
                    <Row key={row.year} row={row} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>Lebih bersih</span>
              <div className="h-2 w-40 rounded-full" style={{
                background: "linear-gradient(90deg, rgb(26,152,80), rgb(255,255,191), rgb(215,48,39))",
              }} />
              <span>Lebih kotor</span>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ row }) {
  return (
    <>
      <div className="flex items-center justify-end pr-1 text-xs font-medium text-gray-600 dark:text-gray-300">
        {row.year}
      </div>
      {row.values.map((v, i) => (
        <div
          key={i}
          className="group relative flex h-10 items-center justify-center rounded-md text-[11px] font-medium"
          style={{ background: heatColor(v), color: v != null && v > 30 ? "#fff" : "#344054" }}
          title={v != null ? `${v} µg/m³` : "tidak ada data"}
        >
          {v != null ? v.toFixed(0) : ""}
        </div>
      ))}
    </>
  );
}

function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
