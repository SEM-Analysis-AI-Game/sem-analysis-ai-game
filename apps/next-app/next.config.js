/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["workspace:packages/drawing"],
    env: {
        API_HOST: "34.234.231.148",
    }
}

module.exports = nextConfig
