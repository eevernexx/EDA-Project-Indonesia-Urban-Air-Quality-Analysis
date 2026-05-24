import { MenuIcon, MoonIcon, SunIcon } from "./icons.jsx";
import { useTheme } from "../lib/theme.jsx";

export default function Header({ onMenu }) {
  const { dark, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 sm:px-6">
      <button
        onClick={onMenu}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 lg:hidden"
        aria-label="Buka/tutup menu"
      >
        <MenuIcon />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
