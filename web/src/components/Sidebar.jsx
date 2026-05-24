import { NavLink } from "react-router-dom";
import { GridIcon, ChartIcon, CloudRainIcon, VirusIcon } from "./icons.jsx";

const nav = [
  { to: "/", label: "Ringkasan", icon: GridIcon, end: true },
  { to: "/temporal", label: "Dari Waktu ke Waktu", icon: ChartIcon },
  { to: "/weather", label: "Cuaca & Udara", icon: CloudRainIcon },
  { to: "/covid", label: "Efek Lockdown", icon: VirusIcon },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-6 dark:border-gray-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <CloudRainIcon width={20} height={20} />
          </div>
          <p className="text-base font-semibold text-gray-800 dark:text-white">
            Kualitas Udara Jakarta
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Menu
          </p>
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                    }`
                  }
                >
                  <item.icon width={20} height={20} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-800">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
              Sumber data
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
              Bacaan kualitas udara dari stasiun pemantau di Jakarta Pusat,
              digabung dengan catatan cuaca NASA, 2019–2023.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
