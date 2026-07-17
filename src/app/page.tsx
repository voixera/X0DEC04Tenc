"use client";

import { Suspense, lazy } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import NotificationProvider from "@/components/notification-provider";
import { useAppStore } from "@/lib/store";

const DashboardPage = lazy(
  () => import("@/components/pages/dashboard-page")
);
const EncryptPage = lazy(
  () => import("@/components/pages/encrypt-page")
);
const HistoryPage = lazy(
  () => import("@/components/pages/history-page")
);
const SettingsPage = lazy(
  () => import("@/components/pages/settings-page")
);
const DocumentationPage = lazy(
  () => import("@/components/pages/documentation-page")
);
const AboutPage = lazy(() => import("@/components/pages/about-page"));

function PageFallback() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-32 w-full" />
      <div className="skeleton h-48 w-full" />
    </div>
  );
}

function PageRenderer() {
  const currentPage = useAppStore((s) => s.currentPage);

  return (
    <Suspense fallback={<PageFallback />}>
      {currentPage === "dashboard" && <DashboardPage />}
      {currentPage === "encrypt" && <EncryptPage />}
      {currentPage === "history" && <HistoryPage />}
      {currentPage === "settings" && <SettingsPage />}
      {currentPage === "documentation" && <DocumentationPage />}
      {currentPage === "about" && <AboutPage />}
    </Suspense>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex overflow-x-hidden">
      <Sidebar />
      <div className="min-w-0 flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        <Topbar />
        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <PageRenderer />
        </main>
      </div>
      <NotificationProvider />
    </div>
  );
}
