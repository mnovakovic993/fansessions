/** @type {import('next').NextConfig} */
const security = [
  // Fanvue frames the creator surface and the fan experience, so it must be allowed as a frame ancestor.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self' https://fanvue.com https://*.fanvue.com" },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Everything except the call page: no camera or microphone.
        source: '/((?!call).*)',
        headers: [...security, { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' }],
      },
      {
        // The call page embeds Daily, which needs camera, microphone and screen capture.
        source: '/call',
        headers: [
          ...security,
          { key: 'Permissions-Policy', value: 'camera=*, microphone=*, display-capture=*, fullscreen=*, geolocation=(), payment=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
