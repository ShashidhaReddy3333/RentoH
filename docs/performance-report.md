# Performance Benchmarks

_Last updated: 2025-11-13_

## Lighthouse (Desktop) - Home page (`/`)

- **Largest Contentful Paint (LCP):** 2.77 s
- **Cumulative Layout Shift (CLS):** 0.0015
- **Performance score:** 96/100

## Lighthouse (Desktop) - Property detail (`/property/prop_royal-loft`)

- **Largest Contentful Paint (LCP):** 3.21 s
- **Cumulative Layout Shift (CLS):** 0.0227
- **Performance score:** 77/100
- **Server response time:** ~3.1 s (audit `server-response-time`)

### How this was measured

```
pnpm build
# Terminal 1
pnpm start

# Terminal 2
npx @lhci/cli collect \
  --url=http://127.0.0.1:3000 \
  --collect.numberOfRuns=1 \
  --collect.settings.chromeFlags="--headless=new"

npx @lhci/cli collect \
  --url=http://127.0.0.1:3000/property/prop_royal-loft \
  --collect.numberOfRuns=1 \
  --collect.settings.chromeFlags="--headless=new"
```

Each run uses the production build via `pnpm start`, executes Lighthouse once, and then removes `.lighthouseci/` artifacts after recording these metrics.
