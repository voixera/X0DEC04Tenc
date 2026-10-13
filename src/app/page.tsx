"use client";

import { Suspense, lazy } from "react";
import LabRail from "@/components/sidebar";
import LabTopbar from "@/components/topbar";
import NotificationProvider from "@/components/notification-provider";
import AuthGate from "@/components/auth-gate";
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
const AccountPage = lazy(() => import("@/components/pages/account-page"));
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
      {currentPage === "account" && <AccountPage />}
      {currentPage === "documentation" && <DocumentationPage />}
      {currentPage === "about" && <AboutPage />}
    </Suspense>
  );
}

export default function Home() {
  return (
    <AuthGate>
      <div className="cocoa-ground flex min-h-screen overflow-x-hidden">
        <LabRail />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-[236px]">
          <LabTopbar />
          <main className="min-w-0 flex-1 p-4 lg:p-7">
            <PageRenderer />
          </main>
        </div>
        <NotificationProvider />
      </div>
    </AuthGate>
  );
}
