#!/usr/bin/env node

/**
 * Script to analyze and report unused imports and dependencies
 * Run with: node scripts/analyze-unused.js
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = ['app', 'components', 'lib'];
const IGNORE_PATTERNS = ['node_modules', '.next', 'dist', 'build'];

// Common unused import patterns
const UNUSED_PATTERNS = [
  { pattern: /import\s+type\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]\s*;\s*$/gm, name: 'Unused type imports' },
  { pattern: /import\s+\{[^}]*\}\s+from\s+['"]react['"]\s*;\s*$/gm, name: 'React imports (check if used)' },
  { pattern: /import\s+.*\s+from\s+['"]lodash['"]\s*;/g, name: 'Full lodash import (use specific)' },
  { pattern: /import\s+\*\s+as\s+\w+\s+from\s+['"]@heroicons/g, name: 'Wildcard icon imports' }
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function scanDirectory(dir) {
  const results = {
    totalFiles: 0,
    issues: [],
    suggestions: []
  };

  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach(file => {
      const filePath = path.join(currentDir, file);
      
      if (shouldIgnore(filePath)) return;

      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scan(filePath);
      } else if (file.match(/\.(tsx?|jsx?)$/)) {
        results.totalFiles++;
        analyzeFile(filePath, results);
      }
    });
  }

  scan(dir);
  return results;
}

function analyzeFile(filePath, results) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);

  // Check for unused import patterns
  UNUSED_PATTERNS.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    if (matches) {
      results.issues.push({
        file: relativePath,
        type: name,
        count: matches.length,
        lines: matches
      });
    }
  });

  // Check for specific optimization opportunities
  checkOptimizations(content, relativePath, results);
}

function checkOptimizations(content, filePath, results) {
  // Full lodash import
  if (content.includes("import _ from 'lodash'") || content.includes('import * as _ from "lodash"')) {
    results.suggestions.push({
      file: filePath,
      suggestion: 'Use specific lodash imports: import debounce from "lodash/debounce"',
      impact: 'High (~50KB reduction)'
    });
  }

  // Wildcard heroicons import
  if (content.match(/import\s+\*\s+as\s+\w+\s+from\s+['"]@heroicons/)) {
    results.suggestions.push({
      file: filePath,
      suggestion: 'Use specific icon imports instead of wildcard',
      impact: 'Medium (~20KB reduction)'
    });
  }

  // Full date-fns locale import
  if (content.includes('from "date-fns/locale"') && content.includes('*')) {
    results.suggestions.push({
      file: filePath,
      suggestion: 'Import specific locale: import { enUS } from "date-fns/locale"',
      impact: 'High (~100KB reduction)'
    });
  }

  // Mapbox GL not dynamically imported
  if (content.includes('import mapboxgl from') && !content.includes('dynamic')) {
    results.suggestions.push({
      file: filePath,
      suggestion: 'Use dynamic import for mapbox-gl to reduce initial bundle',
      impact: 'Very High (~200KB reduction)'
    });
  }

  // Unused React imports
  const reactImportMatch = content.match(/import\s+React(?:,\s*\{[^}]+\})?\s+from\s+['"]react['"]/);
  if (reactImportMatch && !content.includes('React.')) {
    results.suggestions.push({
      file: filePath,
      suggestion: 'Remove unused React import (not needed in Next.js 13+)',
      impact: 'Low (~1KB reduction)'
    });
  }
}

function generateReport(results) {
  console.log('\n📊 Bundle Optimization Analysis Report\n');
  console.log('='.repeat(60));
  console.log(`\n✅ Scanned ${results.totalFiles} files\n`);

  if (results.issues.length > 0) {
    console.log('⚠️  Potential Issues Found:\n');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Count: ${issue.count}`);
      console.log('');
    });
  }

  if (results.suggestions.length > 0) {
    console.log('\n💡 Optimization Suggestions:\n');
    results.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion.file}`);
      console.log(`   ${suggestion.suggestion}`);
      console.log(`   Impact: ${suggestion.impact}`);
      console.log('');
    });
  }

  if (results.issues.length === 0 && results.suggestions.length === 0) {
    console.log('✨ No major issues found! Your imports look optimized.\n');
  }

  console.log('='.repeat(60));
  console.log('\n💡 Next Steps:');
  console.log('1. Run: npm run analyze');
  console.log('2. Review bundle visualization');
  console.log('3. Apply suggested optimizations');
  console.log('4. Re-run analysis to confirm improvements\n');
}

// Main execution
console.log('🔍 Analyzing codebase for optimization opportunities...\n');

const allResults = {
  totalFiles: 0,
  issues: [],
  suggestions: []
};

DIRECTORIES_TO_SCAN.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    const results = scanDirectory(dirPath);
    allResults.totalFiles += results.totalFiles;
    allResults.issues.push(...results.issues);
    allResults.suggestions.push(...results.suggestions);
  }
});

generateReport(allResults);
