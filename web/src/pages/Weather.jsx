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
  ChartCard,
  Card,
  KpiCard,
  Badge,
  Alert,
} from "../components/ui.jsx";
import { CHART, makeAxisStyle, Tooltip, Loading, ErrorBox } from "../components/chart.jsx";
import { CloudRainIcon, DropletIcon } from "../components/icons.jsx";

const SCALE_MAX = 120;

export default function Weather() {
  const { data, error } = useData("weather");
  const theme = useChartTheme();
  const axisStyle = makeAxisStyle(theme);

  return (
    <div>
      <PageHeader
        title="Bagaimana Cuaca Mempengaruhi Udara"
        subtitle="Kondisi cuaca apa yang membersihkan udara Jakarta, dan apa yang memperburuknya?"
      />

      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              title="Apa yang Membersihkan atau Memperburuk Udara?"
              subtitle="Hijau = membuat udara lebih bersih · Merah = membuat lebih kotor · batang lebih panjang = pengaruh lebih kuat"
              className="lg:col-span-2"
            >
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.correlations}
                    margin={{ top: 8, right: 40, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                    <XAxis type="number" domain={[-0.6, 0.3]} {...axisStyle} />
                    <YAxis type="category" dataKey="variable" width={120} {...axisStyle} />
                    <RTooltip content={<Tooltip unit="" />} cursor={{ fill: "rgba(70,95,255,0.05)" }} />
                    <ReferenceLine x={0} stroke={theme.axis} />
                    <Bar dataKey="rho" name="Kekuatan pengaruh" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {data.correlations.map((d) => (
                        <Cell key={d.variable} fill={d.rho < 0 ? CHART.green : CHART.red} />
                      ))}
                      <LabelList dataKey="rho" position="right" fill={theme.label} fontSize={12} fontWeight={600} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Angka menunjukkan seberapa kuat keterkaitannya (dari −1 sampai +1).
                Ini bukan sebab-akibat langsung, melainkan pola yang kuat dan
                konsisten.
              </p>
            </ChartCard>

            <Card className="overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <h3 className="text-base font-semibold text-gray-800 dark:text-white">Penjelasan Singkat</h3>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.correlations.map((c) => (
                  <div key={c.variable} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{c.variable}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        kekuatan keterkaitan: {Math.abs(c.rho)}
                      </p>
                    </div>
                    <Badge tone={c.direction === "reduces" ? "success" : "error"}>
                      {c.direction === "reduces" ? "membersihkan udara" : "memperburuk udara"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCard
              title="Musim Kemarau vs Musim Hujan"
              subtitle={`Kotak = rentang sebagian besar hari · garis = hari tengah · ◆ = rata-rata · skala dibatasi ${SCALE_MAX}`}
              className="lg:col-span-2"
            >
              <div className="space-y-6 py-2">
                <BoxRow label="Musim Kemarau (Mei–Okt)" color={CHART.orange} stats={data.season.dry} />
                <BoxRow label="Musim Hujan (Nov–Apr)" color={CHART.brand} stats={data.season.wet} />
                <Axis />
              </div>
            </ChartCard>

            <div className="space-y-5">
              <KpiCard
                icon={DropletIcon}
                tone="warning"
                label="Rata-rata Musim Kemarau"
                value={`${data.season.dry.mean} µg/m³`}
                sub="lebih sedikit hujan, lebih banyak asap dan kabut"
              />
              <KpiCard
                icon={CloudRainIcon}
                tone="brand"
                label="Rata-rata Musim Hujan"
                value={`${data.season.wet.mean} µg/m³`}
                sub="hujan menyapu polusi dari udara"
              />
              <Card className="p-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">Musim kemarau</p>
                <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">
                  +{data.season.diff_pct}% lebih kotor
                </h4>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">dibanding musim hujan</p>
                <div className="mt-3">
                  <Alert tone={data.season.mannwhitney_p < 0.001 ? "success" : "warning"}>
                    {data.season.mannwhitney_p < 0.001
                      ? "Perbedaan ini nyata, bukan sekadar kebetulan."
                      : "Perbedaan ini mungkin hanya kebetulan."}
                  </Alert>
                </div>
              </Card>
            </div>
          </div>

          <Card className="mt-6 p-5 sm:p-6">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white">Kenapa ini terjadi?</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>• Saat kemarau (Mei–Okt) sedikit hujan, sehingga tak ada yang menyapu partikel dari udara.</li>
              <li>• Asap dari pembakaran dan kabut regional memuncak di bulan-bulan kering.</li>
              <li>• Angin yang lebih tenang membuat polusi menumpuk dekat permukaan tanah.</li>
              <li>• Hujan adalah pembersih udara terbesar — hari hujan terasa jauh lebih jernih.</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function pct(v) {
  return `${(Math.min(v, SCALE_MAX) / SCALE_MAX) * 100}%`;
}

function BoxRow({ label, color, stats }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          tengah {stats.median} · rata-rata {stats.mean} · tertinggi {stats.max}
        </span>
      </div>
      <div className="relative h-9">
        {/* garis whisker */}
        <div
          className="absolute top-1/2 h-px -translate-y-1/2 bg-gray-300 dark:bg-gray-600"
          style={{ left: pct(stats.min), right: `calc(100% - ${pct(stats.max)})` }}
        />
        {/* kotak */}
        <div
          className="absolute top-1/2 h-7 -translate-y-1/2 rounded-md opacity-80"
          style={{
            left: pct(stats.q1),
            width: `calc(${pct(stats.q3)} - ${pct(stats.q1)})`,
            background: color,
          }}
        />
        {/* garis tengah */}
        <div
          className="absolute top-1/2 h-7 w-0.5 -translate-y-1/2 bg-white"
          style={{ left: pct(stats.median) }}
        />
        {/* belah ketupat rata-rata */}
        <div
          className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white"
          style={{ left: pct(stats.mean), background: CHART.navy }}
        />
      </div>
    </div>
  );
}

function Axis() {
  const ticks = [0, 20, 40, 60, 80, 100, 120];
  return (
    <div className="relative h-5 border-t border-gray-200 pt-1 dark:border-gray-700">
      {ticks.map((t) => (
        <span
          key={t}
          className="absolute -translate-x-1/2 text-[11px] text-gray-400 dark:text-gray-500"
          style={{ left: pct(t) }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
