/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
  },
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  // Skip generating static 404/500 pages
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
};

export default nextConfig;
