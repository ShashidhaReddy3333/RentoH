#!/usr/bin/env node

/**
 * Automated script to clean up unused React imports in Next.js 13+ App Router
 * Run with: node scripts/cleanup-imports.js
 */

const fs = require('fs');
const path = require('path');

// Files that need React import cleanup (from analysis)
const FILES_TO_CLEAN = [
  'app/(app)/applications/ApplicationsClient.tsx',
  'app/(app)/listings/new/NewListingClient.tsx',
  'app/(app)/messages/MessagesClient.tsx',
  'app/(app)/tours/ToursClient.tsx',
  'app/auth/sign-in/page.tsx',
  'app/auth/sign-up/page.tsx',
  'app/browse/BrowseClient.tsx',
  'app/browse/page.tsx',
  'app/property/[id]/apply/PropertyApplicationForm.tsx',
  'app/search/SearchClient.tsx',
  'app/settings/notifications/NotificationsClient.tsx',
  'app/theme-provider.tsx',
  'components/auth/EmailOtpForm.tsx',
  'components/auth/SignOutButton.tsx',
  'components/AvatarUploader.tsx',
  'components/ChatList.tsx',
  'components/ChatThread.tsx',
  'components/FiltersSheet.tsx',
  'components/form/field.tsx',
  'components/header.tsx',
  'components/LandlordNavLink.tsx',
  'components/MapLoader.tsx',
  'components/MapPane.tsx',
  'components/MessageInput.tsx',
  'components/ProfileForm.tsx',
  'components/providers/client-shell.tsx',
  'components/providers/supabase-listener.tsx',
  'components/search/listings-map.tsx',
  'components/search/mapbox-map.tsx',
  'components/SearchBar.tsx',
  'components/ui/FavoriteButton.tsx',
  'components/ui/image-with-skeleton.tsx',
  'lib/utils/hooks/index.ts'
];

let totalFixed = 0;
let totalErrors = 0;
const results = {
  fixed: [],
  skipped: [],
  errors: []
};

console.log('🧹 Starting import cleanup...\n');
console.log('='.repeat(60));

function cleanupFile(relativePath) {
  const filePath = path.join(process.cwd(), relativePath);
  
  if (!fs.existsSync(filePath)) {
    results.skipped.push(relativePath);
    console.log(`⏭️  Skipped (not found): ${relativePath}`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;
    let changes = [];

    // Pattern 1: Remove standalone "import React from 'react';"
    if (content.match(/^import React from ['"]react['"];?\s*$/m)) {
      content = content.replace(/^import React from ['"]react['"];?\s*\n/gm, '');
      changes.push('Removed standalone React import');
    }

    // Pattern 2: Convert "import React, { ... }" to "import { ... }"
    if (content.match(/^import React, \{/m)) {
      content = content.replace(/^import React, \{/gm, 'import {');
      changes.push('Removed React from combined import');
    }

    // Pattern 3: Remove "import * as React from 'react';" if not used
    if (content.match(/^import \* as React from ['"]react['"];?\s*$/m)) {
      // Check if React. is used in the file
      if (!content.includes('React.')) {
        content = content.replace(/^import \* as React from ['"]react['"];?\s*\n/gm, '');
        changes.push('Removed unused namespace React import');
      }
    }

    // Only write if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      results.fixed.push({ file: relativePath, changes });
      totalFixed++;
      console.log(`✅ Fixed: ${relativePath}`);
      changes.forEach(change => console.log(`   - ${change}`));
    } else {
      results.skipped.push(relativePath);
      console.log(`⏭️  No changes needed: ${relativePath}`);
    }
  } catch (error) {
    results.errors.push({ file: relativePath, error: error.message });
    totalErrors++;
    console.error(`❌ Error: ${relativePath}`);
    console.error(`   ${error.message}`);
  }
}

// Process all files
FILES_TO_CLEAN.forEach(cleanupFile);

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Cleanup Summary\n');
console.log(`✅ Fixed: ${totalFixed} files`);
console.log(`⏭️  Skipped: ${results.skipped.length} files`);
console.log(`❌ Errors: ${totalErrors} files`);

if (results.fixed.length > 0) {
  console.log('\n📝 Files Modified:');
  results.fixed.forEach(({ file, changes }) => {
    console.log(`\n  ${file}`);
    changes.forEach(change => console.log(`    - ${change}`));
  });
}

if (results.errors.length > 0) {
  console.log('\n⚠️  Errors Encountered:');
  results.errors.forEach(({ file, error }) => {
    console.log(`\n  ${file}`);
    console.log(`    ${error}`);
  });
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Next Steps:');
console.log('1. Run: npm run typecheck');
console.log('2. Run: npm run lint');
console.log('3. Run: npm run test');
console.log('4. Review changes: git diff');
console.log('5. Commit: git commit -m "chore: remove unused React imports"');
console.log('');

process.exit(totalErrors > 0 ? 1 : 0);
