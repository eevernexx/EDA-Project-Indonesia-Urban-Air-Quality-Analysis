import { ArrowUpIcon, ArrowDownIcon } from "./icons.jsx";

export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-card dark:border-gray-800 dark:bg-gray-800/50 ${className}`}
    >
      {children}
    </div>
  );
}

export function ChartCard({ title, subtitle, action, children, className = "" }) {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-800 dark:text-white">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </Card>
  );
}

const toneMap = {
  brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

export function KpiCard({ icon: Icon, tone = "brand", label, value, sub, trend }) {
  return (
    <Card className="p-5">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${toneMap[tone]}`}
      >
        <Icon width={24} height={24} />
      </div>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <h4 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white">{value}</h4>
        </div>
        {trend && <TrendBadge trend={trend} />}
      </div>
      {sub && <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </Card>
  );
}

export function TrendBadge({ trend }) {
  // trend: { dir: "up" | "down" | null, text, tone }
  const tone =
    trend.tone ||
    (trend.dir === "up" ? "error" : trend.dir === "down" ? "success" : "gray");
  const cls = {
    success: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500",
    error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500",
    warning: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  }[tone];
  const Arrow = trend.dir === "up" ? ArrowUpIcon : trend.dir === "down" ? ArrowDownIcon : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {Arrow && <Arrow width={14} height={14} />}
      {trend.text}
    </span>
  );
}

export function Badge({ tone = "gray", children }) {
  const cls = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
    success: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500",
    warning: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500",
    error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}

export function Alert({ tone = "warning", children }) {
  const cls = {
    warning: "border-warning-500/30 bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500",
    success: "border-success-500/30 bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500",
    error: "border-error-500/30 bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-500",
    brand: "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>
  );
}
