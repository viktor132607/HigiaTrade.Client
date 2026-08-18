# HygiaTrade Next.js FE

Static Next.js export client configured to connect to the matching ASP.NET Core Web API backend.

## Local run

```bash
npm install
npm run dev
```

Local API env:

```env
NEXT_PUBLIC_API_URL=http://localhost:10000/api
```

## Static build

```bash
npm run build
```

Output folder:

```txt
out
```

## Render Static Site

Build command:

```bash
npm install && npm run build
```

Publish directory:

```txt
out
```

Environment variable:

```env
NEXT_PUBLIC_API_URL=https://hygiatrade-api.onrender.com/api
```

This FE is configured for Render Static Site and does not use API routes, SSR, middleware, server actions, or optimized `next/image`.
