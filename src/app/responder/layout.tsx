import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Icon } from "@/components/ui/Icon";
import { LogoutButton } from "@/components/responder/LogoutButton";

export default function ResponderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Link href="/responder" className="press flex items-center gap-2.5">
              <CivoraLogo size={30} withWordmark={false} />
              <span className="text-[15px] font-semibold tracking-tight text-ink">
                Civora <span className="text-ink-soft">Response</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="press hidden min-h-9 items-center gap-1.5 rounded-btn px-3 text-[13px] font-medium text-ink-soft hover:bg-muted hover:text-ink sm:inline-flex"
            >
              <Icon name="eye" className="h-4 w-4" />
              Citizen view
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
