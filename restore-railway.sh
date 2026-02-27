#!/bin/bash
# Run this after extracting a Readdy export to restore Railway-compatible config files

echo "Restoring Railway config files..."

# Restore Railway config files from git
git checkout HEAD -- \
  package.json \
  vite.config.ts \
  tsconfig.json \
  tsconfig.app.json \
  tsconfig.node.json \
  eslint.config.js \
  index.html \
  src/App.tsx \
  src/main.tsx \
  src/index.css \
  src/config/api.ts \
  src/pages/home/components/Footer.tsx \
  src/pages/home/components/Hero.tsx \
  src/pages/home/components/StickyBanner.tsx

# Remove Readdy-specific files
rm -rf src/i18n
rm -f postcss.config.ts tailwind.config.ts vite-env.d.ts eslint.config.ts
rm -f public/robots.txt public/sitemap.xml

# Remove Contact.tsx (no contact form)
rm -f src/pages/home/components/Contact.tsx

echo "Done! Railway config restored."
echo ""
echo "Run 'npm run build' to verify the build works."
