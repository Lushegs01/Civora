import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import nextConfig from "../../next.config.mjs";

// The headers are part of the product's guarantees, so they are asserted here
// rather than left to be noticed when they regress.

function cspFor(request = new NextRequest("http://localhost:3000/home")) {
  return middleware(request).headers.get("content-security-policy") ?? "";
}

function directive(csp: string, name: string): string {
  const found = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `) || d === name);
  return found ?? "";
}

describe("Content-Security-Policy", () => {
  it("locks down the dangerous directives", () => {
    const csp = cspFor();
    expect(directive(csp, "default-src")).toBe("default-src 'self'");
    expect(directive(csp, "object-src")).toBe("object-src 'none'");
    expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
    expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
    expect(directive(csp, "form-action")).toBe("form-action 'self'");
  });

  it("does not allow scripts from arbitrary hosts", () => {
    const script = directive(cspFor(), "script-src");
    // The previous policy allowed connect-src https:, i.e. any host at all.
    expect(directive(cspFor(), "connect-src")).toBe("connect-src 'self'");
    expect(script).not.toContain("https:");
    expect(script).not.toContain("*");
  });

  it("issues a fresh nonce for every request", () => {
    const first = cspFor();
    const second = cspFor();
    expect(first).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(first).not.toBe(second);
  });

  it("keeps unsafe-eval out of the production policy", () => {
    const script = directive(cspFor(), "script-src");
    // NODE_ENV is "test" here, which takes the production branch.
    expect(script).not.toContain("'unsafe-eval'");
    expect(script).not.toContain("'unsafe-inline'");
  });
});

interface HeaderGroup {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

async function headerGroup(match: (source: string) => boolean): Promise<HeaderGroup> {
  const groups = (await nextConfig.headers()) as HeaderGroup[];
  const found = groups.find((g) => match(g.source));
  if (!found) throw new Error("No matching header group is configured.");
  return found;
}

describe("static security headers", () => {
  it("sets the full set on every route", async () => {
    const group = await headerGroup((source) => source === "/(.*)");
    const keys = group.headers.map((h) => h.key.toLowerCase());

    for (const required of [
      "x-content-type-options",
      "referrer-policy",
      "x-frame-options",
      "permissions-policy",
      "cross-origin-opener-policy"
    ]) {
      expect(keys).toContain(required);
    }
  });

  it("denies the permissions Civora never needs", async () => {
    const group = await headerGroup((source) => source === "/(.*)");
    const permissions = group.headers.find((h) => h.key === "Permissions-Policy")?.value ?? "";

    expect(permissions).toContain("camera=()");
    expect(permissions).toContain("microphone=()");
    expect(permissions).toContain("payment=()");
    // Geolocation is the one capability the reporting flow genuinely uses.
    expect(permissions).toContain("geolocation=(self)");
  });

  it("never lets a shared cache hold an evidence file", async () => {
    const group = await headerGroup((source) => source.includes("evidence-file"));
    expect(group.headers[0].value).toContain("no-store");
    expect(group.headers[0].value).toContain("private");
  });
});
