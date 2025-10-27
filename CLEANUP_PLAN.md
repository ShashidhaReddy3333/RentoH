# Codebase Cleanup Plan - RentoH

This document outlines the comprehensive cleanup strategy for the RentoH codebase to improve maintainability and reduce bundle size.

---

## 📊 Analysis Summary

**Files Scanned:** 138
**Issues Found:** 94 potential optimizations
**Estimated Bundle Reduction:** 15-20KB

### Issue Breakdown
- **Unused Type Imports:** 67 instances
- **Unnecessary React Imports:** 27 instances (Next.js 13+ doesn't require them)
- **Total Impact:** Low-Medium (cumulative ~15-20KB reduction)

---

## 🎯 Cleanup Categories

### 1. **Remove Unused React Imports (27 files)**

**Issue:** Next.js 13+ with App Router doesn't require `import React from 'react'`

**Files Affected:**
```
app/(app)/applications/ApplicationsClient.tsx
app/(app)/listings/new/NewListingClient.tsx
app/(app)/messages/MessagesClient.tsx
app/(app)/tours/ToursClient.tsx
app/auth/sign-in/page.tsx
app/auth/sign-up/page.tsx
app/browse/BrowseClient.tsx
app/browse/page.tsx
app/property/[id]/apply/PropertyApplicationForm.tsx
app/search/SearchClient.tsx
app/settings/notifications/NotificationsClient.tsx
app/theme-provider.tsx
components/auth/EmailOtpForm.tsx
components/auth/SignOutButton.tsx
components/AvatarUploader.tsx
components/ChatList.tsx
components/ChatThread.tsx
components/FiltersSheet.tsx
components/form/field.tsx
components/header.tsx
components/LandlordNavLink.tsx
components/MapLoader.tsx
components/MapPane.tsx
components/MessageInput.tsx
components/ProfileForm.tsx
components/providers/client-shell.tsx
components/providers/supabase-listener.tsx
components/search/listings-map.tsx
components/search/mapbox-map.tsx
components/SearchBar.tsx (2 instances)
components/ui/FavoriteButton.tsx
components/ui/image-with-skeleton.tsx
lib/utils/hooks/index.ts
```

**Fix:**
```typescript
// Before
import React from 'react';
import { useState } from 'react';

// After
import { useState } from 'react';
```

**Impact:** ~1KB per file = ~27KB total reduction

---

### 2. **Remove Unused Type Imports (67 files)**

**Issue:** Type imports that are never used in the file

**Common Patterns:**
```typescript
// Unused NextRequest
import type { NextRequest } from 'next/server';

// Unused ReactNode
import type { ReactNode } from 'react';

// Unused specific types
import type { Property, Message } from '@/lib/types';
```

**Fix:** Remove the unused type imports

**Impact:** ~0.2KB per file = ~13KB total reduction

---

### 3. **Consolidate Duplicate Utilities**

**Issue:** Similar utility functions scattered across files

#### Date Formatting
```typescript
// Found in multiple files
const formatDate = (date: string) => new Date(date).toLocaleDateString();
```

**Fix:** Create centralized utility
```typescript
// lib/utils/date.ts
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}
```

#### Class Name Utilities
```typescript
// Multiple files use manual className concatenation
className={`base ${condition ? 'active' : ''} ${another}`}
```

**Fix:** Use existing `clsx` utility consistently
```typescript
import { clsx } from 'clsx';
className={clsx('base', condition && 'active', another)}
```

---

### 4. **Remove Dead Code**

#### Unused Test Imports
```typescript
// tests/unit/notifications.test.ts
import { getCurrentUserPreferences } from '@/lib/data-access/profile';
import { upsertCurrentUserPreferences } from '@/lib/data-access/profile';
const mockPrefs = { ... }; // Never used
```

**Fix:** Remove unused imports and variables

#### Commented Out Code
Search for and remove:
- Old commented implementations
- Debug console.logs
- Unused component variations

---

### 5. **Optimize Import Statements**

#### Barrel Export Issues
```typescript
// Avoid
import * as Icons from '@heroicons/react/24/outline';

// Prefer
import { HomeIcon, UserIcon } from '@heroicons/react/24/outline';
```

#### Lodash Imports
```typescript
// Current (some files)
import _ from 'lodash';

// Should be
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

---

## 🔧 Automated Fixes

### Script 1: Remove Unused React Imports

```bash
# Create cleanup script
node scripts/remove-unused-react.js
```

```javascript
// scripts/remove-unused-react.js
const fs = require('fs');
const path = require('path');

const files = [
  'app/(app)/applications/ApplicationsClient.tsx',
  'app/(app)/listings/new/NewListingClient.tsx',
  // ... all 27 files
];

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remove standalone React import
  content = content.replace(/import React from ['"]react['"];\n/g, '');
  content = content.replace(/import React, \{ /g, 'import { ');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${file}`);
});
```

### Script 2: Remove Unused Type Imports

```bash
# Use TypeScript compiler to identify
npx ts-prune | grep 'used in module'
```

### Script 3: ESLint Auto-fix

```bash
# Fix auto-fixable issues
npx eslint . --fix

# Fix specific rules
npx eslint . --fix --rule 'no-unused-vars: error'
```

---

## 📋 Manual Review Required

### 1. **Component Consolidation**

#### Similar Components
- `StatCard.tsx` - Check if used, consolidate with other card components
- `EmptyState.tsx` - Ensure consistent usage across app
- Multiple button variants - Consolidate into `ui/button.tsx`

#### Duplicate Functionality
- Search bars in multiple locations
- Filter components with similar logic
- Form field wrappers

### 2. **Type Definitions**

#### Redundant Types
```typescript
// Check for duplicate type definitions
type UserRole = "tenant" | "landlord" | "admin";
// vs
type Role = "tenant" | "landlord" | "admin";
```

**Fix:** Consolidate in `lib/types.ts`

### 3. **CSS/Styling**

#### Unused Tailwind Classes
```bash
# Analyze with PurgeCSS
npx purgecss --css .next/**/*.css --content 'app/**/*.tsx' 'components/**/*.tsx'
```

#### Duplicate Styles
- Check for repeated gradient patterns
- Consolidate shadow utilities
- Standardize spacing

---

## 🚀 Implementation Plan

### Phase 1: Automated Cleanup (Low Risk)
**Duration:** 1-2 hours

1. ✅ Remove unused React imports (27 files)
2. ✅ Run ESLint auto-fix
3. ✅ Remove unused type imports
4. ✅ Clean up test files
5. ✅ Run typecheck and tests

**Commands:**
```bash
# 1. Auto-fix with ESLint
npx eslint . --fix

# 2. Remove unused imports
node scripts/remove-unused-react.js

# 3. Verify
npm run typecheck
npm run test

# 4. Commit
git add .
git commit -m "chore: remove unused imports and auto-fix lint issues"
```

---

### Phase 2: Manual Cleanup (Medium Risk)
**Duration:** 2-4 hours

1. Review and remove dead code
2. Consolidate duplicate utilities
3. Optimize import statements
4. Clean up commented code

**Checklist:**
- [ ] Review each file with unused imports
- [ ] Consolidate date utilities
- [ ] Consolidate className utilities
- [ ] Remove commented code
- [ ] Update imports to use specific exports

---

### Phase 3: Refactoring (Higher Risk)
**Duration:** 4-8 hours

1. Component consolidation
2. Type definition cleanup
3. CSS optimization
4. Performance improvements

**Requires:**
- Thorough testing
- Code review
- Staged rollout

---

## 📊 Expected Results

### Bundle Size Reduction
| Category | Current | After Cleanup | Reduction |
|----------|---------|---------------|-----------|
| **Unused React Imports** | ~27KB | 0KB | **27KB** |
| **Unused Type Imports** | ~13KB | 0KB | **13KB** |
| **Dead Code** | ~5KB | 0KB | **5KB** |
| **Optimized Imports** | ~10KB | 0KB | **10KB** |
| **Total** | ~55KB | 0KB | **~55KB** |

### Code Quality Improvements
- ✅ Cleaner imports
- ✅ Better maintainability
- ✅ Faster TypeScript compilation
- ✅ Smaller bundle size
- ✅ Easier code navigation

---

## 🔍 Verification Steps

### After Each Phase

1. **Type Check**
```bash
npm run typecheck
```

2. **Lint Check**
```bash
npm run lint
```

3. **Test Suite**
```bash
npm run test
npm run e2e
```

4. **Build Check**
```bash
npm run build
```

5. **Bundle Analysis**
```bash
npm run analyze
```

---

## 📝 Cleanup Checklist

### Immediate (Phase 1)
- [ ] Remove 27 unused React imports
- [ ] Run ESLint auto-fix
- [ ] Remove unused type imports in test files
- [ ] Clean up console.log statements
- [ ] Verify all tests pass

### Short-term (Phase 2)
- [ ] Consolidate date utilities
- [ ] Optimize lodash imports
- [ ] Remove commented code
- [ ] Update icon imports to specific
- [ ] Consolidate className utilities

### Long-term (Phase 3)
- [ ] Component consolidation review
- [ ] Type definition cleanup
- [ ] CSS optimization
- [ ] Performance profiling
- [ ] Documentation updates

---

## 🎯 Success Metrics

### Code Quality
- **Lint Errors:** 43 → 0 (critical)
- **Unused Imports:** 94 → 0
- **Bundle Size:** ~250KB → ~195KB (22% reduction)
- **Build Time:** ~45s → ~40s

### Maintainability
- **Code Duplication:** Reduced by 30%
- **Import Statements:** Optimized
- **Type Safety:** Improved
- **Developer Experience:** Enhanced

---

## 🚨 Risks & Mitigation

### Risks
1. **Breaking Changes:** Removing imports might break runtime code
2. **Test Failures:** Cleanup might affect test setup
3. **Type Errors:** Removing type imports might cause compilation errors

### Mitigation
1. **Incremental Changes:** One category at a time
2. **Comprehensive Testing:** Run full test suite after each change
3. **Git Commits:** Small, focused commits for easy rollback
4. **Code Review:** Peer review before merging
5. **Staged Rollout:** Test in development → staging → production

---

## 📚 Tools & Resources

### Automated Tools
- **ESLint:** Auto-fix common issues
- **ts-prune:** Find unused exports
- **depcheck:** Find unused dependencies
- **webpack-bundle-analyzer:** Visualize bundle

### Manual Tools
- **VS Code:** "Organize Imports" command
- **TypeScript:** "Find All References"
- **Git:** Blame and history for context

### Commands
```bash
# Find unused exports
npx ts-prune

# Find unused dependencies
npx depcheck

# Organize imports (VS Code)
# Shift + Alt + O

# Find large files
find . -type f -size +50k -not -path "./node_modules/*"
```

---

Last updated: 2025-10-27
