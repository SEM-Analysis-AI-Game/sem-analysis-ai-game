# Configuring the Environment

Insert the public IP or domain name where the application will be hosted into `apps/next-app/next.config.js` under the `env` section with the key: `API_HOST`.

### DNS example:

```
/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["workspace:packages/drawing"],
    env: {
        API_HOST: "www.example.com",
    }
}

module.exports = nextConfig
```

### IP example:

```
/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["workspace:packages/drawing"],
    env: {
        API_HOST: "123.456.789.012",
    }
}

module.exports = nextConfig
```

# Installing and Building

The following command will build a docker image with all of the dependencies necessary.

```

docker build --pull -t behind-density-lines .

```

# Running

The following command will run the website on port 4000, the gif-encoder on 4001, and the scoring service on 4002.

```

docker run -p 4000:3000 -p 4001:3001 -p 4002:3002 behind-density-lines

```
