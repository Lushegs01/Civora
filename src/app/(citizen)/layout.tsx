import { Sidebar } from "@/components/shell/Sidebar";
import { MobileBottomNav } from "@/components/shell/MobileBottomNav";
import { OfflineBanner } from "@/components/system/OfflineBanner";
import { CitizenInit } from "@/components/system/CitizenInit";

// Citizen app shell: bottom navigation on mobile, sidebar on desktop.
export default function CitizenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <CitizenInit />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />
        <div className="flex-1 pb-24 md:pb-0">{children}</div>
        <MobileBottomNav />
      </div>
    </div>
  );
}
