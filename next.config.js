/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: './tsconfig.json'
  },
  // Note: allowedDevOrigins n'est pas dans experimental pour Next.js 14.2
  // Pour autoriser Cloudflare tunnel en dev:
  // 1) En local: NEXTAUTH_URL=http://localhost:3000
  // 2) Avec cloudflared: NEXTAUTH_URL=https://xxxxx.trycloudflare.com
  // Next.js App Router gère automatiquement les origins en mode dev
};

module.exports = nextConfig;
