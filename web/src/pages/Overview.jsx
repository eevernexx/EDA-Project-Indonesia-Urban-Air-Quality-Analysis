import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip as RTooltip,
  LabelList,
} from "recharts";
import { useData } from "../lib/data.js";
import { useChartTheme } from "../lib/theme.jsx";
import {
  PageHeader,
  KpiCard,
  ChartCard,
  Card,
  Badge,
} from "../components/ui.jsx";
import { CHART, makeAxisStyle, Tooltip, Loading, ErrorBox } from "../components/chart.jsx";
import { DropletIcon, AlertIcon, ArrowUpIcon, CalendarIcon } from "../components/icons.jsx";

function barColor(v) {
  return v > 35 ? CHART.red : v > 25 ? CHART.orange : CHART.green;
}

export default function Overview() {
  const { data, error } = useData("overview");
  const theme = useChartTheme();
  const axisStyle = makeAxisStyle(theme);

  return (
    <div>
      <PageHeader
        title="Ringkasan"
        subtitle="Seberapa bersih (atau kotor) udara Jakarta? Ringkasan tahunan, 2019–2022."
      />

      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={DropletIcon}
              tone="error"
              label="Rata-rata Polusi"
              value={`${data.kpis.overall_mean} µg/m³`}
              trend={{ dir: "up", text: `${data.kpis.who_multiple}× batas aman`, tone: "error" }}
              sub="jauh di atas batas aman yang dianjurkan"
            />
            <KpiCard
              icon={AlertIcon}
              tone="warning"
              label="Hari Udara Tidak Sehat"
              value={`${data.kpis.pct_exceed}%`}
              sub="dari seluruh hari melebihi batas aman harian"
            />
            <KpiCard
              icon={ArrowUpIcon}
              tone="error"
              label="Hari Terburuk"
              value={`${data.kpis.worst_day} µg/m³`}
              sub={data.kpis.worst_date}
            />
            <KpiCard
              icon={CalendarIcon}
              tone="success"
              label="Tahun Terbersih"
              value={`${data.kpis.best_annual_mean} µg/m³`}
              trend={{ dir: null, text: `Tahun ${data.kpis.best_annual_year}`, tone: "success" }}
              sub="rata-rata tahunan terendah"
            />
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            "PM2.5" adalah partikel polusi sangat kecil yang berbahaya bagi
            paru-paru. Udara dianggap aman di bawah <b>15 µg/m³</b> dalam sehari dan{" "}
            <b>5 µg/m³</b> untuk rata-rata setahun.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              title="Rata-rata Polusi per Tahun"
              subtitle="Rata-rata tahunan dibandingkan dengan batas aman"
              className="lg:col-span-2"
              action={
                <div className="hidden items-center gap-3 text-xs sm:flex">
                  <Legend color={CHART.green} label="Baik" />
                  <Legend color={CHART.orange} label="Sedang" />
                  <Legend color={CHART.red} label="Tidak Sehat" />
                </div>
              }
            >
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.annual_chart} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                    <XAxis dataKey="year" {...axisStyle} />
                    <YAxis {...axisStyle} />
                    <RTooltip content={<Tooltip />} cursor={{ fill: "rgba(70,95,255,0.05)" }} />
                    <ReferenceLine
                      y={data.who.annual}
                      stroke={CHART.red}
                      strokeDasharray="6 4"
                      label={{ value: "Aman (5)", position: "insideTopRight", fill: CHART.red, fontSize: 11 }}
                    />
                    <ReferenceLine
                      y={data.who.ispu}
                      stroke={CHART.orange}
                      strokeDasharray="2 4"
                      label={{ value: "Batas Indonesia (35)", position: "insideTopRight", fill: CHART.orange, fontSize: 11 }}
                    />
                    <Bar dataKey="mean" name="Rata-rata tahunan" radius={[6, 6, 0, 0]} maxBarSize={64}>
                      {data.annual_chart.map((d) => (
                        <Cell key={d.year} fill={barColor(d.mean)} />
                      ))}
                      <LabelList
                        dataKey="mean"
                        position="top"
                        fill={theme.label}
                        fontSize={12}
                        fontWeight={600}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Sekilas" subtitle="Ringkasan 2019–2022">
              <ul className="space-y-4">
                <Insight
                  label="Kali lipat dari batas aman"
                  value={`${data.kpis.who_multiple}×`}
                  tone="error"
                />
                <Insight
                  label="Hari tidak sehat"
                  value={`${data.kpis.pct_exceed}%`}
                  tone="warning"
                />
                <Insight
                  label="Tahun terbersih"
                  value={`${data.kpis.best_annual_year} · ${data.kpis.best_annual_mean} µg/m³`}
                  tone="success"
                />
                <Insight
                  label="Hari terburuk"
                  value={`${data.kpis.worst_day} µg/m³`}
                  tone="error"
                />
              </ul>
            </ChartCard>
          </div>

          <Card className="mt-6 overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                Rincian per Tahun
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    {["Tahun", "Hari Terukur", "Rata-rata", "Hari Biasa", "Naik-Turun", "Hari Lebih Bersih", "Hari Lebih Kotor", "Hari Tidak Sehat"].map((h) => (
                      <th key={h} className="px-6 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.map((r) => (
                    <tr key={r.year} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">{r.year}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{r.count}</td>
                      <td className="px-6 py-3">
                        <Badge tone={r.mean > 35 ? "error" : r.mean > 25 ? "warning" : "success"}>
                          {r.mean}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{r.median}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">±{r.std}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{r.q25}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{r.q75}</td>
                      <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{r.pct_exceed}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
              "Hari Biasa" = nilai tengah · "Naik-Turun" = seberapa besar polusi berubah dari hari ke hari · "Hari Lebih Bersih / Lebih Kotor" = seperempat hari terbersih dan terkotor dalam setahun.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function Insight({ label, value, tone }) {
  const dot = {
    error: "bg-error-500",
    warning: "bg-warning-500",
    success: "bg-success-500",
    brand: "bg-brand-500",
  }[tone];
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 dark:text-white">{value}</span>
    </li>
  );
}
