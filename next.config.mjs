/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  serverExternalPackages: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
}

export default nextConfig
