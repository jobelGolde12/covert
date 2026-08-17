/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, context) => {
    // pdfjs-dist statically requires the Node-only `canvas` package; in the
    // browser bundle that import is dead code (guarded by an isNodeJS check),
    // and the native binary isn't built. Swap it for an empty stub — see
    // documentation/technical-specifications.md §9.
    config.plugins.push(
      new context.webpack.NormalModuleReplacementPlugin(/^canvas$/, (resource) => {
        resource.request = require.resolve("./lib/shims/canvas-stub.ts");
      })
    );
    // bullmq imports an optional valkey-glide binding we never use — skip it
    config.resolve.alias = { ...config.resolve.alias, "@valkey/valkey-glide": false };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com",
              "connect-src 'self' https://fonts.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
