import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CookieConsentBanner } from "../CookieConsentBanner";

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 p-4 md:p-6 lg:p-2 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>
      <CookieConsentBanner />
    </div>
  );
}
