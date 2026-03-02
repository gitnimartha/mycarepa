/**
 * Sync UI files from Readdy download to version-controlled project
 *
 * Usage: node sync-from-readdy.js "E:\path\to\readdy\download"
 *
 * This script:
 * 1. Copies UI component files from Readdy
 * 2. Fixes Readdy-specific code (__BASE_PATH__, REACT_APP_NAVIGATE, i18n)
 * 3. Skips core files that should not be overwritten
 */

const fs = require('fs');
const path = require('path');

const sourceDir = process.argv[2];

if (!sourceDir) {
  console.error('Usage: node sync-from-readdy.js "E:\\path\\to\\readdy\\download"');
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`ERROR: Source folder not found: ${sourceDir}`);
  process.exit(1);
}

const destDir = path.join(__dirname, '..');

// Files to NEVER overwrite (core files with different setup)
// Paths relative to src/ folder
const SKIP_FILES = [
  'App.tsx',
  'main.tsx',
  'index.css',
  'config/api.ts', // Keep our API config
];

// Folders to skip entirely (relative to src/)
const SKIP_FOLDERS = [
  'i18n', // Readdy's i18n - not needed
];

// Track changes
const changes = {
  copied: [],
  skipped: [],
  fixed: [],
};

/**
 * Fix Readdy-specific code in file content
 */
function fixReaddyCode(content, filePath) {
  let fixed = content;
  const fixes = [];

  // Remove i18n imports
  if (fixed.includes("from './i18n'") || fixed.includes('from "./i18n"') || fixed.includes("from '../i18n'")) {
    fixed = fixed.replace(/import\s+.*\s+from\s+['"]\.\.?\/i18n['"];\n?/g, '');
    fixes.push('removed i18n import');
  }

  // Remove I18nextProvider imports and wrapper
  if (fixed.includes('I18nextProvider')) {
    fixed = fixed.replace(/import\s*{\s*I18nextProvider\s*}\s*from\s*['"]react-i18next['"];\n?/g, '');
    fixed = fixed.replace(/<I18nextProvider\s+i18n={i18n}>\s*/g, '');
    fixed = fixed.replace(/\s*<\/I18nextProvider>/g, '');
    fixes.push('removed I18nextProvider');
  }

  // Fix __BASE_PATH__ in BrowserRouter
  if (fixed.includes('basename={__BASE_PATH__}')) {
    fixed = fixed.replace(/\s*basename={__BASE_PATH__}/g, '');
    fixes.push('removed __BASE_PATH__ from BrowserRouter');
  }

  // Fix __BASE_PATH__ in URL comparisons
  // window.location.pathname === __BASE_PATH__ || window.location.pathname === __BASE_PATH__ + '/'
  if (fixed.includes('__BASE_PATH__')) {
    // Replace complex pathname checks
    fixed = fixed.replace(
      /window\.location\.pathname\s*===\s*['"]\/['"]\s*\|\|\s*window\.location\.pathname\s*===\s*__BASE_PATH__\s*\|\|\s*window\.location\.pathname\s*===\s*__BASE_PATH__\s*\+\s*['"]\/['"]/g,
      "window.location.pathname === '/'"
    );
    fixed = fixed.replace(
      /window\.location\.pathname\s*===\s*__BASE_PATH__\s*\|\|\s*window\.location\.pathname\s*===\s*__BASE_PATH__\s*\+\s*['"]\/['"]/g,
      "window.location.pathname === '/'"
    );
    // Replace remaining __BASE_PATH__ references
    fixed = fixed.replace(/const\s+basePath\s*=\s*__BASE_PATH__\s*\|\|\s*['"]['"]/g, "const basePath = ''");
    fixed = fixed.replace(/`\$\{__BASE_PATH__\}\/`/g, "'/'");
    fixed = fixed.replace(/`\$\{basePath\}\/#\$\{id\}`/g, "`/#${id}`");
    fixed = fixed.replace(/__BASE_PATH__\s*\|\|\s*['"]\/['"]/g, "'/'");
    fixed = fixed.replace(/__BASE_PATH__/g, "''");
    fixes.push('fixed __BASE_PATH__ references');
  }

  // Fix window.REACT_APP_NAVIGATE to use standard navigation
  // Pattern: window.REACT_APP_NAVIGATE('/path')
  if (fixed.includes('window.REACT_APP_NAVIGATE')) {
    // Add Link import if not present and file uses REACT_APP_NAVIGATE
    if (!fixed.includes("from 'react-router-dom'") && !fixed.includes('from "react-router-dom"')) {
      // Add import at the top after other imports
      const importMatch = fixed.match(/^(import\s+.*\n)+/m);
      if (importMatch) {
        const lastImport = importMatch[0];
        fixed = fixed.replace(lastImport, lastImport + "import { Link, useNavigate } from 'react-router-dom';\n");
      }
    }

    // Replace onClick handlers that use REACT_APP_NAVIGATE with Link components
    // This is complex - for now just replace with window.location.href
    fixed = fixed.replace(
      /onClick=\{\(e\)\s*=>\s*\{\s*e\.preventDefault\(\);\s*window\.REACT_APP_NAVIGATE\(['"]([^'"]+)['"]\);\s*\}\}/g,
      'onClick={() => window.location.href = "$1"}'
    );
    fixed = fixed.replace(/window\.REACT_APP_NAVIGATE\(['"]([^'"]+)['"]\)/g, "window.location.href = '$1'");
    fixes.push('fixed REACT_APP_NAVIGATE calls');
  }

  // Remove "Powered by Readdy" link (optional - comment out if you want to keep it)
  if (fixed.includes('readdy.ai/?ref=logo')) {
    fixed = fixed.replace(/<div className="mt-6 text-center">\s*<a\s+href="https:\/\/readdy\.ai\/\?ref=logo"[^<]*<\/a>\s*<\/div>/gs, '');
    fixes.push('removed Readdy branding');
  }

  return { content: fixed, fixes };
}

/**
 * Copy file with fixes
 */
function copyFile(srcPath, destPath, relativePath) {
  // Check if should skip
  const relativeNormalized = relativePath.replace(/\\/g, '/');

  if (SKIP_FILES.includes(relativeNormalized)) {
    changes.skipped.push({ file: relativePath, reason: 'core file - never overwrite' });
    return;
  }

  // Check if in skip folder
  for (const skipFolder of SKIP_FOLDERS) {
    if (relativeNormalized.startsWith(skipFolder)) {
      changes.skipped.push({ file: relativePath, reason: `in ${skipFolder} - not needed` });
      return;
    }
  }

  // Read source file
  let content = fs.readFileSync(srcPath, 'utf8');

  // Fix Readdy-specific code for .tsx and .ts files
  if (srcPath.endsWith('.tsx') || srcPath.endsWith('.ts')) {
    const { content: fixedContent, fixes } = fixReaddyCode(content, relativePath);
    if (fixes.length > 0) {
      content = fixedContent;
      changes.fixed.push({ file: relativePath, fixes });
    }
  }

  // Ensure destination directory exists
  const destDirPath = path.dirname(destPath);
  if (!fs.existsSync(destDirPath)) {
    fs.mkdirSync(destDirPath, { recursive: true });
  }

  // Write file
  fs.writeFileSync(destPath, content);
  changes.copied.push(relativePath);
}

/**
 * Recursively copy directory
 */
function copyDir(srcDir, destDir, baseDir = srcDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relativePath = path.relative(baseDir, srcPath);

    if (entry.isDirectory()) {
      // Check if should skip folder
      const relativeNormalized = relativePath.replace(/\\/g, '/');
      let shouldSkip = false;
      for (const skipFolder of SKIP_FOLDERS) {
        if (relativeNormalized === skipFolder || relativeNormalized.startsWith(skipFolder + '/')) {
          changes.skipped.push({ file: relativePath, reason: 'folder not needed' });
          shouldSkip = true;
          break;
        }
      }
      if (!shouldSkip) {
        copyDir(srcPath, destPath, baseDir);
      }
    } else {
      copyFile(srcPath, destPath, relativePath);
    }
  }
}

// Main
console.log('==========================================');
console.log('  Sync from Readdy');
console.log('==========================================\n');
console.log(`Source: ${sourceDir}`);
console.log(`Destination: ${destDir}\n`);

// Only sync src folder (UI code)
const srcSource = path.join(sourceDir, 'src');
const srcDest = path.join(destDir, 'src');

if (!fs.existsSync(srcSource)) {
  console.error('ERROR: No src folder found in Readdy download');
  process.exit(1);
}

console.log('Syncing src folder...\n');
copyDir(srcSource, srcDest, srcSource);

// Also sync public folder if exists
const publicSource = path.join(sourceDir, 'public');
const publicDest = path.join(destDir, 'public');
if (fs.existsSync(publicSource)) {
  console.log('Syncing public folder...\n');
  copyDir(publicSource, publicDest, publicSource);
}

// Report
console.log('------------------------------------------');
console.log(`Copied: ${changes.copied.length} files`);
changes.copied.forEach(f => console.log(`  + ${f}`));

if (changes.fixed.length > 0) {
  console.log(`\nFixed Readdy code in ${changes.fixed.length} files:`);
  changes.fixed.forEach(f => console.log(`  * ${f.file}: ${f.fixes.join(', ')}`));
}

if (changes.skipped.length > 0) {
  console.log(`\nSkipped: ${changes.skipped.length} files`);
  changes.skipped.forEach(f => console.log(`  - ${f.file} (${f.reason})`));
}

console.log('\n==========================================');
console.log('  Sync Complete!');
console.log('==========================================\n');
console.log('Next steps:');
console.log('  1. Review changes: git diff');
console.log('  2. Test locally: npm run dev:all');
console.log('  3. Commit if good: git add -A && git commit -m "Sync UI from Readdy"');
console.log('');
