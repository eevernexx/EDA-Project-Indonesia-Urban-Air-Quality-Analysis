import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:ml-64">
        <Header onMenu={() => setOpen((v) => !v)} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
