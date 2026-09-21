"use client";

import { useEffect } from "react";

// What a reader sees when something throws.
//
// Without this file Next.js renders its production fallback: an otherwise
// empty page carrying the line "Application error: a client-side exception has
// occurred". That is indistinguishable from a white screen, tells the reader
// nothing, and tells whoever has to fix it even less — the digest that would
// identify the failure in the logs is never shown.
//
// A civic platform whose whole argument is that people should be able to see
// what is known cannot answer a failure with a blank page.

export default function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Reaches the browser console and any attached reporting.
    console.error("civora.route_error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-soft">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
        This page didn&apos;t load
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
        The rest of Civora is still working. Nothing you submitted has been lost — reports are saved
        before this screen could be reached.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Try again
        </button>
        <a
          href="/home"
          className="rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-muted"
        >
          Go to home
        </a>
      </div>
      {error.digest ? (
        <p className="mt-8 font-mono text-[11px] text-ink-soft">
          Reference: {error.digest}
        </p>
      ) : null}
    </main>
  );
}
