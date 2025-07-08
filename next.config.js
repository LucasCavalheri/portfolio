/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.graphassets.com'
      },
      {
        protocol: 'https',
        hostname: 'sa-east-1.graphassets.com'
      }
    ]
  }
}

module.exports = nextConfig
