/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Fanvue frames the creator surface and the fan experience, so it must be allowed as a frame ancestor.
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://fanvue.com https://*.fanvue.com" },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // The call page (phase 3) opens in its own tab and needs camera and microphone there.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
