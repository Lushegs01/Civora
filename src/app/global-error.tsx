"use client";

import { useEffect } from "react";

// The last resort: an error thrown in the root layout itself, above every
// route-level boundary. It has to render its own <html> and <body>, because
// the layout that would normally provide them is what failed.
//
// Deliberately styled inline rather than with Tailwind classes — if the
// failure happened before or during the stylesheet's own setup, class names
// would resolve to nothing and this page would be blank too, which is the
// exact outcome it exists to prevent.

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("civora.global_error", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F7F2",
          color: "#111110",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
        }}
      >
        <main style={{ maxWidth: 560, padding: "0 24px" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#6F6F6B" }}>
            Civora
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Civora couldn&apos;t start
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.6, color: "#55554F" }}>
            This is a fault in the application, not in anything you did. Reloading usually clears it.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 26,
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              background: "#111110",
              border: 0,
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Reload
          </button>
          {error.digest ? (
            <p style={{ marginTop: 28, fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#6F6F6B" }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
