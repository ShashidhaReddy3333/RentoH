# Testing Guide - RentoH Improvements

This guide will help you test all the new features and improvements made to the RentoH platform.

---

## Prerequisites

**Test Accounts:**
- **Landlord:** shashidharreddy3333@gmail.com / Shashi@0203
- **Customer:** shashidharreddy3827@gmail.com / Shashi@0203

**Environment Setup:**
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test
pnpm run e2e
```

---

## 1. Testing Property Comparison Feature

### Step 1: Add Properties to Comparison
1. Navigate to `/browse`
2. Find a property card
3. Click the **"Compare"** button at the bottom of the card
4. Notice the button changes to **"Added"** with a checkmark
5. Repeat for 2 more properties (maximum 3)
6. Try clicking a 4th property - button should be disabled

### Step 2: View Comparison
1. Click **"Compare"** in the header navigation
2. You should see a side-by-side comparison table
3. Verify all property details are displayed:
   - Images
   - Titles
   - Prices
   - Bedrooms/Bathrooms
   - Location
   - Amenities

### Step 3: Remove from Comparison
1. Click the **X** button on any property in the comparison table
2. Property should be removed immediately
3. Click **"Clear All"** to remove all properties
4. You should see an empty state with a link to browse

### Step 4: Test Persistence
1. Add 2 properties to comparison
2. Close the browser tab
3. Open a new tab and go to `/compare`
4. Your comparison should still be there (localStorage)

**Expected Behavior:**
- ✅ Can add up to 3 properties
- ✅ Can't add more than 3
- ✅ Comparison persists across sessions
- ✅ Can remove individual properties
- ✅ Can clear all at once

---

## 2. Testing Advanced Search with Suggestions

### Step 1: Search with Suggestions
1. Navigate to the home page (`/`)
2. Click in the search bar
3. You should see your recent searches (if any)
4. Type "Water" in the search box
5. See suggestions appear: "Waterloo"
6. Click on a suggestion to search

### Step 2: Recent Searches
1. Perform a search for "Waterloo"
2. Go back to home page
3. Click in the search bar without typing
4. You should see "Waterloo" in recent searches
5. Perform 5 different searches
6. Only the most recent 5 should be shown

### Step 3: Clear Recent Searches
1. Click in the search bar
2. Click **"Clear"** next to "Recent Searches"
3. Recent searches should disappear
4. Popular cities should still show when typing

### Step 4: Keyboard Navigation
1. Click in the search bar
2. Type "k" to filter suggestions
3. Use **Arrow Down** to navigate suggestions
4. Press **Enter** to select
5. Should navigate to `/browse?city=Kitchener`

**Expected Behavior:**
- ✅ Shows recent searches on focus
- ✅ Shows filtered suggestions while typing
- ✅ Maximum 5 recent searches stored
- ✅ Can clear recent searches
- ✅ Keyboard accessible

---

## 3. Testing UI/UX Improvements

### Step 1: Shadow System
1. Navigate to any page
2. Observe property cards, buttons, and modals
3. Shadows should be subtle and layered (not harsh)
4. Check dark mode (toggle in header)
5. Shadows should adapt to dark theme

### Step 2: Responsive Design
1. Resize browser from 1920px to 320px
2. All content should reflow properly
3. No horizontal scrolling
4. Navigation becomes mobile menu below 1024px
5. Property grid: 3 columns → 2 columns → 1 column

### Step 3: Button States
1. Find any button
2. Hover: Should have visual feedback
3. Click: Should show active state
4. Focus (Tab key): Should show prominent focus ring
5. Loading state: Should show spinner

**Expected Behavior:**
- ✅ Consistent spacing (8px grid)
- ✅ Smooth transitions (150ms)
- ✅ Clear hover states
- ✅ Visible focus indicators
- ✅ Mobile responsive

---

## 4. Testing Accessibility Improvements

### Step 1: Keyboard Navigation
1. **Tab** through the entire home page
2. Every interactive element should be reachable
3. Focus indicators should be clearly visible
4. Skip link should appear at the top on first Tab
5. Press **Enter** on skip link to jump to main content

### Step 2: Screen Reader Testing (Optional)
**Windows (NVDA):**
```bash
# Download NVDA: https://www.nvaccess.org/download/
# Press Insert+Down to start reading
```

**Mac (VoiceOver):**
```bash
# Press Cmd+F5 to enable VoiceOver
# Press Ctrl+Option+Right Arrow to navigate
```

**What to Test:**
- Image alt text is descriptive
- Buttons announce their purpose
- Form inputs have labels
- Error messages are announced

### Step 3: Color Contrast
1. Open browser DevTools
2. Inspect any text element
3. Check contrast ratio (should be ≥4.5:1 for AA)
4. Test both light and dark modes

### Step 4: High Contrast Mode (Windows)
```bash
# Enable High Contrast: Settings → Ease of Access → High Contrast
```
- Borders should be thicker
- Focus states still visible
- Content remains readable

**Expected Behavior:**
- ✅ All interactive elements keyboard accessible
- ✅ Focus indicators meet 3:1 contrast ratio
- ✅ Alt text for all images
- ✅ ARIA labels on icon buttons
- ✅ Skip link functional

---

## 5. Testing Core Functionality

### Step 1: Sign In & Authentication
1. Go to `/auth/sign-in`
2. Enter landlord credentials
3. Should redirect to `/dashboard`
4. Profile dropdown should show landlord-specific actions

### Step 2: Browse Listings
1. Navigate to `/browse`
2. Apply filters (price range, bedrooms, etc.)
3. Filters should update URL query params
4. Results should update without full page reload
5. Toggle map view (if Mapbox token configured)

### Step 3: View Property Details
1. Click on any property card
2. Should navigate to `/property/[slug]`
3. Image gallery should be functional
4. Contact landlord button should work (if authenticated)
5. Favorite button should toggle (if authenticated)

### Step 4: Send Message
1. From property detail page
2. Click **"Contact Landlord"**
3. Should open message modal or navigate to messages
4. Send a test message
5. Check `/messages` to see conversation

### Step 5: Apply to Property
1. From property detail page (as tenant)
2. Click **"Apply Now"**
3. Fill out application form
4. Submit application
5. Check `/applications` to see status

**Expected Behavior:**
- ✅ Authentication flows work correctly
- ✅ Browse/filter/search functions properly
- ✅ Property details load completely
- ✅ Messaging system functional
- ✅ Application submission works

---

## 6. Testing Performance

### Step 1: Lighthouse Audit
1. Open Chrome DevTools (F12)
2. Go to **Lighthouse** tab
3. Select **Desktop** or **Mobile**
4. Click **Generate report**
5. Check scores:
   - Performance: ≥85
   - Accessibility: ≥95
   - Best Practices: ≥95
   - SEO: ≥95

### Step 2: Network Performance
1. Open DevTools → Network tab
2. Reload the home page
3. Check metrics:
   - First Contentful Paint: <2s
   - Largest Contentful Paint: <2.5s
   - Total page size: <2MB
4. Verify images are lazy-loaded (scroll down slowly)

### Step 3: Bundle Size
```bash
pnpm run analyze
```
- Review bundle analysis report
- Main bundle should be <300KB gzipped
- No duplicate dependencies

**Expected Behavior:**
- ✅ Fast page loads (<3s on 3G)
- ✅ Images lazy-loaded
- ✅ Code-split by route
- ✅ No layout shift (CLS < 0.1)

---

## 7. Testing Dark Mode

### Step 1: Toggle Dark Mode
1. Click the **theme toggle** in the header (sun/moon icon)
2. Page should smoothly transition to dark mode
3. All text should remain readable
4. Check multiple pages:
   - Home page
   - Browse page
   - Dashboard
   - Property details

### Step 2: Persistence
1. Toggle dark mode ON
2. Refresh the page
3. Dark mode should persist (localStorage)
4. Open a new tab
5. Dark mode should be active there too

### Step 3: System Preference
1. Clear localStorage: `localStorage.clear()`
2. Set OS theme to dark
3. Reload page
4. Should automatically use dark mode

**Expected Behavior:**
- ✅ Smooth theme transitions
- ✅ All elements adapt to dark mode
- ✅ Theme persists across sessions
- ✅ Respects system preferences

---

## 8. Testing Mobile Experience

### Step 1: Responsive Navigation
1. Resize browser to mobile width (<768px)
2. Header should show mobile menu button (hamburger)
3. Click menu button to open drawer
4. All nav links should be accessible
5. Close by clicking outside or X button

### Step 2: Touch Interactions
1. Use Chrome DevTools device emulation
2. Test swipe gestures (if implemented)
3. Tap targets should be ≥44x44px
4. No accidental clicks on adjacent elements

### Step 3: Mobile-Specific Features
1. Property cards should stack vertically
2. Forms should be easy to fill on mobile
3. Images should load appropriate sizes
4. No horizontal scrolling

**Expected Behavior:**
- ✅ Responsive breakpoints work correctly
- ✅ Mobile navigation functional
- ✅ Touch targets adequately sized
- ✅ Content readable without zooming

---

## 9. Edge Cases & Error Handling

### Test 1: Empty States
1. Go to `/compare` without adding properties
2. Should show helpful empty state
3. Go to `/messages` with no conversations
4. Should show empty state with CTA
5. Go to `/favorites` with no favorites
6. Should show empty state

### Test 2: Network Errors
1. Disconnect from internet
2. Try to load a property page
3. Should show error message
4. Reconnect and retry
5. Content should load

### Test 3: Invalid Routes
1. Navigate to `/property/invalid-slug`
2. Should show 404 page
3. 404 page should have link back to browse
4. Navigate to `/random-nonexistent-page`
5. Same behavior

### Test 4: Form Validation
1. Try submitting empty forms
2. Should show validation errors
3. Errors should be clearly visible
4. Fix errors and resubmit
5. Should succeed

**Expected Behavior:**
- ✅ Helpful empty states
- ✅ Graceful error handling
- ✅ Clear error messages
- ✅ Form validation works

---

## 10. Cross-Browser Testing

### Browsers to Test
- ✅ Chrome 120+ (Primary)
- ✅ Firefox 121+ 
- ✅ Safari 17+
- ✅ Edge 120+

### What to Check
1. Layout consistency
2. Font rendering
3. CSS animations
4. Focus states
5. Form inputs

### Known Issues
- IE11: Not supported (Next.js 14 requirement)
- Safari <14: Some CSS features may not work

---

## 11. Automated Testing

### Run Unit Tests
```bash
pnpm test
```
**Tests:**
- Button component rendering
- Slug generation utility
- Supabase config banner

### Run E2E Tests
```bash
# Ensure .env.test is configured
pnpm run e2e
```
**Tests:**
- Authentication flows
- Listing creation
- Application submission
- Message sending
- Favorites toggling

### Run Accessibility Tests
```bash
pnpm run e2e -- accessibility.spec.ts
```
**Tests:**
- No axe violations on key pages
- Keyboard navigation works
- Focus management correct

---

## 12. Reporting Issues

### Bug Report Template
```markdown
**Bug Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Screen size: 1920x1080

**Screenshots:**
[Attach screenshots if applicable]
```

### Where to Report
- GitHub Issues: https://github.com/ShashidhaReddy3333/RentoH/issues
- Include browser console errors
- Attach screenshots/videos if possible

---

## 13. Performance Benchmarks

### Target Metrics
| Metric | Target | How to Measure |
|--------|--------|----------------|
| **First Contentful Paint** | <1.5s | Lighthouse |
| **Largest Contentful Paint** | <2.5s | Lighthouse |
| **Time to Interactive** | <3.5s | Lighthouse |
| **Cumulative Layout Shift** | <0.1 | Lighthouse |
| **First Input Delay** | <100ms | Web Vitals |

### How to Measure
```bash
# Install lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://rento-h.vercel.app --view
```

---

## 14. Checklist

### Before Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Lighthouse scores meet targets
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Mobile responsive verified
- [ ] Dark mode working correctly
- [ ] All features documented
- [ ] Environment variables configured
- [ ] Database migrations applied (if needed)
- [ ] Analytics configured (optional)

### After Deployment
- [ ] Verify production build works
- [ ] Check error monitoring (Sentry, etc.)
- [ ] Monitor performance metrics
- [ ] Test with real users
- [ ] Gather feedback
- [ ] Plan next iteration

---

## 15. Quick Feature Reference

### New Features
1. **Property Comparison** - `/compare` page
2. **Advanced Search** - Home page search bar with suggestions
3. **Enhanced Shadows** - Subtle, premium design
4. **Improved Focus States** - Better accessibility
5. **Recent Search History** - Stored in localStorage

### Improved Features
1. **Property Cards** - Added comparison button
2. **Navigation** - Added Compare link
3. **Dark Mode** - Already functional, just documented
4. **Accessibility** - Enhanced keyboard navigation
5. **Performance** - Code splitting and lazy loading

---

## 16. Support & Resources

### Documentation
- Main README: `/README.md`
- Accessibility Guide: `/ACCESSIBILITY.md`
- Improvements Report: `/PROJECT_IMPROVEMENTS_REPORT.md`
- Schema Updates: `/supabase/RECOMMENDED_SCHEMA_UPDATES.sql`

### Useful Commands
```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server

# Testing
pnpm test                   # Unit tests
pnpm run e2e                # E2E tests
pnpm run lint               # Lint check
pnpm run typecheck          # Type check

# Analysis
pnpm run analyze            # Bundle analysis
pnpm run analyze:unused     # Find unused code
```

### Getting Help
- Check console for errors
- Review browser DevTools Network tab
- Check Supabase logs
- Read error messages carefully
- Search GitHub issues

---

**Happy Testing! 🚀**

Report any issues or suggestions for improvement.
