# Bundle Analysis Playbook

This doc captures the quickest way to inspect client/server bundle weight for the Rento app and enforce the route-level budgets defined in the performance playbook.

## 1. Produce build artifacts

```bash
NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 ANALYZE=false npm run build
```

This primes `.next/` with the latest output and catches type errors before analyzing.

## 2. Run the webpack analyzer

```bash
ANALYZE=true npm run analyze
```

This uses Next's built-in bundle analyzer plugin and generates interactive treemaps at:

- `.next/analyze/client.html` – client bundle by route
- `.next/analyze/server.html` – server bundle/runtime chunks

Open the HTML files in your browser to inspect the largest modules, shared chunks, and duplication (e.g. `mapbox-gl`, Supabase helpers).

## 3. Track route budgets

Use `nextjs-bundle-analysis` for CLI-friendly reports and trend tracking:

```bash
npx nextjs-bundle-analysis --build-output .next --format table
```

Key budgets to enforce:

- **Route JS**: < 180 KB gzipped per route
- **Shared JS**: < 90 KB gzipped
- **Edge/server chunks**: < 150 KB per function

For regression gates in CI, pipe the tool through `--budget <file>` with thresholds:

```bash
npx nextjs-bundle-analysis --build-output .next --budget scripts/bundle-budget.json
```

## 4. Extract per-route metrics

To focus on a specific page, run:

```bash
npx nextjs-bundle-analysis --build-output .next --page /search --format json
```

Feed the JSON into a spreadsheet or PR comment to show current vs. target deltas.

## 5. Optimize iteratively

1. Run `npm run lint && npm run test` after changes to catch regressions early.
2. Re-run steps 1–4 to verify reductions.
3. Capture before/after numbers in PR description to document progress.

> Tip: Cache `.next/analyze` artifacts between runs (e.g., via GitHub Actions `actions/cache`) to baseline and detect growth.
