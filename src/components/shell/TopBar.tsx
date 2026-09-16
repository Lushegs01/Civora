import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";

export function TopBar({ action }: { action?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" aria-label="Civora home" className="press rounded-lg">
          <CivoraLogo size={30} />
        </Link>
        {action}
      </div>
    </header>
  );
}
