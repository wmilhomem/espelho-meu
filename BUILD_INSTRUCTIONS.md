# Build Instructions

## Fixing Bun/npm Conflicts

If you encounter build errors related to package manager conflicts, follow these steps:

### 1. Clean all lock files and node_modules

```bash
rm -rf node_modules
rm -f bun.lockb
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
```

### 2. Install dependencies with npm

```bash
npm install
```

### 3. Run the build

```bash
npm run build
```

### 4. Deploy

After successful build locally, commit and push:

```bash
git add .
git commit -m "fix: configure npm as package manager"
git push
```

## Why This is Needed

The project was previously using Bun, but Vercel deployment now requires npm/pnpm. The `packageManager` field in package.json ensures npm is used consistently across all environments.

## Supabase Configuration

The project uses:
- `@supabase/supabase-js` v2.48.1
- `@supabase/ssr` v0.5.2
- Next.js 15 with transpilePackages for Supabase ESM modules

These are configured in `next.config.mjs` to ensure proper webpack bundling.
