import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
  Tooltip as RTooltip,
} from "recharts";
import { useData } from "../lib/data.js";
import { useChartTheme } from "../lib/theme.jsx";
import { PageHeader, ChartCard, Card, KpiCard, Alert, Badge } from "../components/ui.jsx";
import { CHART, makeAxisStyle, Tooltip, Loading, ErrorBox } from "../components/chart.jsx";
import { VirusIcon, ChartIcon, AlertIcon } from "../components/icons.jsx";

const LIMITS = [
  ["Satu sensor", "Data berasal dari satu stasiun di Jakarta Pusat, yang mungkin tidak mewakili seluruh kota."],
  ["Nyaris seimbang", "Hasilnya tepat di ambang batas keyakinan, jadi sebaiknya dibaca dengan hati-hati."],
  ["Model tak sempurna", "Beberapa pola dalam data belum sepenuhnya tertangkap, walau sudah kami sesuaikan sebaik mungkin."],
  ["Tanpa kota pembanding", "Kami tak bisa sepenuhnya menyingkirkan perubahan tingkat nasional yang terjadi bersamaan."],
  ["Perilaku nyata tak diketahui", "Kami tak punya data langsung soal seberapa banyak orang benar-benar diam di rumah saat lockdown."],
  ["Hari yang hilang", "Sekitar 1 dari 5 hari di 2020 tidak ada bacaannya, terutama bulan Oktober."],
];

export default function Covid() {
  const { data, error } = useData("covid");
  const theme = useChartTheme();
  const axisStyle = makeAxisStyle(theme);

  const fmtDate = (s) =>
    new Date(s).toLocaleDateString("id-ID", { month: "short", year: "numeric" });

  const confidence = data ? Math.round((1 - data.its.pval) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Apakah Lockdown COVID Membersihkan Udara?"
        subtitle="Lockdown Jakarta (PSBB) mengurangi lalu lintas dan aktivitas. Apakah udara benar-benar jadi lebih bersih — setelah memperhitungkan cuaca dan musim?"
      />

      {error && <ErrorBox message={error} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <SectionTitle n="1" title="Teka-teki: Apakah Lockdown Membantu?" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <KpiCard
              icon={ChartIcon}
              tone="gray"
              label="Sebelum Lockdown"
              value={`${data.puzzle.pre_mean} µg/m³`}
              sub="Jan 2019 – Apr 2020"
            />
            <KpiCard
              icon={VirusIcon}
              tone="warning"
              label="Saat Lockdown"
              value={`${data.puzzle.during_mean} µg/m³`}
              trend={{ dir: data.puzzle.naive_pct >= 0 ? "up" : "down", text: `${data.puzzle.naive_pct > 0 ? "+" : ""}${data.puzzle.naive_pct}% vs sebelumnya`, tone: "warning" }}
              sub="Apr – Jun 2020 (paling ketat)"
            />
            <KpiCard
              icon={ChartIcon}
              tone="gray"
              label="Setelah Lockdown"
              value={`${data.puzzle.post_mean} µg/m³`}
              sub="Okt 2020 – Des 2021"
            />
          </div>
          <div className="mt-4">
            <Alert tone="warning">
              <b>Sekilas, udara hampir tidak berubah ({data.puzzle.naive_pct > 0 ? "+" : ""}{data.puzzle.naive_pct}%).</b>{" "}
              Tapi perbandingan sederhana ini mengabaikan cuaca. Hari hujan
              membersihkan udara dengan sendirinya, jadi kita perlu
              memperhitungkan cuaca untuk menemukan efek lockdown yang sebenarnya.
            </Alert>
          </div>

          <SectionTitle n="2" title="Memperhitungkan Cuaca & Musim" className="mt-8" />
          <Card className="p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Perbandingan sederhana bisa menyesatkan: bisa jadi udara tampak sama
              hanya karena kebetulan saat itu musim yang lebih kering dan berdebu.
              Agar adil, kami memakai model statistik yang menyingkirkan pengaruh{" "}
              <b>cuaca</b> (hujan, angin, kelembapan, suhu) dan <b>waktu dalam
              setahun</b>. Sisa perubahan yang tertinggal itulah bagian yang masuk
              akal kita kaitkan dengan lockdown itu sendiri.
            </p>
          </Card>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <KpiCard
              icon={VirusIcon}
              tone="success"
              label="Efek Lockdown Sebenarnya"
              value={`${data.its.effect_pct}%`}
              trend={{ dir: "down", text: "lebih sedikit polusi", tone: "success" }}
              sub="setelah cuaca & musim dihilangkan"
            />
            <KpiCard
              icon={ChartIcon}
              tone="brand"
              label="Kisaran Paling Mungkin"
              value={`${data.its.ci_lo}% s/d ${data.its.ci_hi}%`}
              sub="kemungkinan letak efek sebenarnya"
            />
            <KpiCard
              icon={AlertIcon}
              tone={data.its.significant ? "success" : "warning"}
              label="Seberapa Yakin Kita?"
              value={`≈${confidence}%`}
              sub={data.its.significant ? "sangat mungkin efek nyata, bukan kebetulan" : "bisa jadi hanya kebetulan"}
            />
          </div>
          {data.its.significant && (
            <div className="mt-4">
              <Alert tone="success">
                <b>Lockdown dikaitkan dengan penurunan polusi udara sekitar {Math.abs(data.its.effect_pct)}%</b>{" "}
                (kemungkinan besar antara {data.its.ci_lo}% dan {data.its.ci_hi}%),
                bahkan setelah memperhitungkan cuaca dan waktu dalam setahun.
              </Alert>
            </div>
          )}

          <SectionTitle n="3" title="Udara Nyata vs 'Andai Tidak Ada Lockdown'" className="mt-8" />
          <ChartCard
            title="Polusi Nyata vs Prediksi Tanpa Lockdown"
            subtitle="Garis putus-putus merah menunjukkan polusi yang diperkirakan terjadi jika tidak ada lockdown"
          >
            <div className="h-[440px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                  <XAxis dataKey="date" {...axisStyle} tickFormatter={fmtDate} minTickGap={48} />
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
                  <Line type="monotone" dataKey="observed" name="Nyata" stroke={CHART.light} strokeWidth={1} dot={false} isAnimationActive={false} connectNulls />
                  <Line type="monotone" dataKey="predicted" name="Perkiraan model" stroke={theme.label} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />
                  <Line type="monotone" dataKey="counterfactual" name="Tanpa lockdown" stroke={CHART.red} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <LegendDot color={CHART.light} label="Udara nyata" />
              <LegendDot color={theme.label} label="Perkiraan model" />
              <LegendDot color={CHART.red} label="Jika tidak ada lockdown" />
            </div>
          </ChartCard>

          <SectionTitle n="4" title="Hal yang Perlu Diingat" className="mt-8" />
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {LIMITS.map(([k, v]) => (
                <div key={k} className="flex flex-col gap-1 px-6 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="sm:w-52">
                    <Badge tone="gray">{k}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{v}</p>
                </div>
              ))}
            </div>
          </Card>
          <p className="mt-4 text-sm italic text-gray-500 dark:text-gray-400">
            Singkatnya: ini bukti kuat yang mengarah ke sana — bukan bukti mutlak.
            Kesimpulan yang lebih pasti butuh lebih banyak data dan metode yang lebih
            canggih.
          </p>
        </>
      )}
    </div>
  );
}

function SectionTitle({ n, title, className = "" }) {
  return (
    <div className={`mb-4 flex items-center gap-3 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        {n}
      </span>
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>
    </div>
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
