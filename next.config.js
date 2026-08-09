const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 👈 This fixes the Docker COPY error
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "exceljs"],
  },
  images: {
    domains: [],
  },
};

module.exports = withPWA(nextConfig);
