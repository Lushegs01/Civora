import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <CivoraLogo size={40} />
      <h1 className="mt-6 text-[24px] font-bold tracking-[-0.02em] text-ink">
        This page isn't here
      </h1>
      <p className="mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
        The case or page you're looking for doesn't exist — case IDs look like CS-1042. Nothing was
        lost; your device's drafts and tracked cases are untouched.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Button href="/home">Back to home</Button>
        <Button href="/community" variant="secondary">
          Browse community cases
        </Button>
      </div>
    </main>
  );
}
