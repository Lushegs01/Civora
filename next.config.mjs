/** @type {import('next').NextConfig} */

// Headers that do not depend on the request live here; the per-request
// Content-Security-Policy is built in src/middleware.ts so it can carry a
// nonce in production.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    // Civora asks for geolocation only, and only when the reporter taps
    // "use my current location". Everything else is denied outright.
    key: "Permissions-Policy",
    value: [
      "geolocation=(self)",
      "camera=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "interest-cohort=()"
    ].join(", ")
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" }
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push({
        // Two years, including subdomains. Only meaningful over HTTPS, which
        // is what every supported deployment target serves.
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload"
      });
    }
    return [
      { source: "/(.*)", headers },
      {
        // Evidence must never be held by a shared cache.
        source: "/api/evidence-file/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }]
      }
    ];
  }
};

export default nextConfig;
