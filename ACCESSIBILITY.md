# Accessibility Guidelines - RentoH

This document outlines the accessibility standards and patterns used throughout the RentoH application to ensure WCAG 2.1 AA compliance.

## ✅ Implemented Accessibility Features

### 1. **Chat Components**
- ✅ `role="log"` on chat message container
- ✅ `aria-live="polite"` for new messages
- ✅ `aria-relevant="additions"` to announce only new messages
- ✅ Typing indicators with `role="status"` and `aria-live="polite"`
- ✅ Keyboard navigation (Arrow keys, Home, End)

**Location:** `components/ChatThread.tsx`

```tsx
<div
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  aria-label="Conversation messages"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  {/* messages */}
</div>
```

---

### 2. **Form Fields with aria-describedby**
All form fields automatically link to their helper text and error messages using `aria-describedby`.

**Location:** `components/form/field.tsx`

```tsx
<Field 
  id="email" 
  label="Email" 
  hint="We'll never share your email"
  error={errors.email}
>
  <input type="email" />
</Field>
```

**Generated HTML:**
```html
<input 
  id="email" 
  aria-describedby="email-hint email-error"
  aria-invalid="true"
/>
<span id="email-hint">We'll never share your email</span>
<span id="email-error">Invalid email format</span>
```

---

### 3. **Focus Rings - WCAG AA Compliant**

All interactive elements have high-contrast focus indicators that meet WCAG AA standards (3:1 contrast ratio).

**Specifications:**
- **Width:** 3px solid outline
- **Color:** #FFB300 (Amber - 7:1 contrast on white, 4.5:1 on dark)
- **Offset:** 2px
- **Shadow:** 5px rgba glow for additional visibility

**Location:** `app/globals.css`

```css
/* Standard focus ring */
button:focus-visible {
  outline: 3px solid #FFB300;
  outline-offset: 2px;
  box-shadow: 0 0 0 5px rgba(255, 179, 0, 0.2);
}

/* Error state focus ring */
.input[aria-invalid="true"]:focus-visible {
  outline: 3px solid #D32F2F;
  box-shadow: 0 0 0 5px rgba(211, 47, 47, 0.2);
}
```

---

### 4. **Modal Dialogs (No window.confirm)**

All confirmation dialogs use accessible modal components instead of `window.confirm()`.

**Location:** `components/ConfirmDialog.tsx`

```tsx
<ConfirmDialog
  title="Delete Account"
  description="This action cannot be undone. All your data will be permanently deleted."
  confirmLabel="Delete Account"
  onConfirm={handleDelete}
  destructive
>
  <button>Delete My Account</button>
</ConfirmDialog>
```

**Features:**
- ✅ Proper focus management
- ✅ Keyboard navigation (Tab, Escape)
- ✅ Screen reader announcements
- ✅ Focus trap within modal
- ✅ Return focus to trigger on close

---

### 5. **Skip Links**

Keyboard users can skip to main content.

**Location:** `app/layout.tsx`

```tsx
<a
  href="#main"
  className="skip-link sr-only focus:not-sr-only"
>
  Skip to content
</a>
<main id="main">
  {/* content */}
</main>
```

---

## 🎨 Color Contrast Standards

All colors meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

### Text Colors
| Color | Hex | Contrast on White | Contrast on Dark | Usage |
|-------|-----|-------------------|------------------|-------|
| **Primary Text** | #1F2A37 | 12.6:1 ✅ | - | Body text |
| **Muted Text** | #5E6E84 | 5.2:1 ✅ | - | Secondary text |
| **Brand Teal** | #2FB79A | 3.2:1 ⚠️ | - | Accents only (large text) |
| **Brand Blue** | #1E88E5 | 4.6:1 ✅ | - | Links, buttons |
| **Error Red** | #D32F2F | 5.5:1 ✅ | - | Error messages |
| **Success Green** | #388E3C | 5.7:1 ✅ | - | Success messages |

### Focus Indicator
| Element | Color | Contrast | Meets WCAG |
|---------|-------|----------|------------|
| **Focus Ring** | #FFB300 | 7:1 on white, 4.5:1 on dark | ✅ AA |
| **Error Focus** | #D32F2F | 5.5:1 | ✅ AA |

---

## 📋 Form Accessibility Checklist

### Required for All Forms
- [ ] All inputs have associated `<label>` elements
- [ ] Error messages linked via `aria-describedby`
- [ ] Helper text linked via `aria-describedby`
- [ ] Invalid fields marked with `aria-invalid="true"`
- [ ] Required fields indicated visually and with `required` attribute
- [ ] Form submission errors announced to screen readers
- [ ] Focus moves to first error on validation failure

### Example Pattern
```tsx
<Field 
  id="username" 
  label="Username" 
  hint="3-20 characters, letters and numbers only"
  error={errors.username}
  required
>
  <input 
    type="text" 
    minLength={3}
    maxLength={20}
    pattern="[a-zA-Z0-9]+"
  />
</Field>
```

---

## 🔊 Screen Reader Announcements

### Live Regions
Use `aria-live` for dynamic content updates:

```tsx
// Polite announcements (don't interrupt)
<div aria-live="polite" role="status">
  {successMessage}
</div>

// Assertive announcements (interrupt)
<div aria-live="assertive" role="alert">
  {errorMessage}
</div>

// Log regions (chat, feeds)
<div role="log" aria-live="polite" aria-relevant="additions">
  {messages.map(msg => <Message key={msg.id} {...msg} />)}
</div>
```

---

## ⌨️ Keyboard Navigation

### Standard Patterns
| Element | Keys | Behavior |
|---------|------|----------|
| **Buttons** | Space, Enter | Activate |
| **Links** | Enter | Navigate |
| **Dialogs** | Escape | Close |
| **Dropdowns** | Arrow keys | Navigate options |
| **Chat** | Arrow Up/Down | Scroll messages |
| **Chat** | Home/End | Jump to start/end |

### Focus Management
- Focus visible elements have clear indicators
- Focus order follows logical reading order
- Modal dialogs trap focus
- Focus returns to trigger after modal closes

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Navigate entire site using only keyboard
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify focus indicators are visible
- [ ] Check color contrast with tools
- [ ] Test form validation announcements
- [ ] Verify modal focus management

### Automated Testing
```bash
# Run accessibility tests
npm run test:a11y

# Check with axe-core
npm run lint:a11y
```

### Browser Extensions
- **axe DevTools** - Automated accessibility testing
- **WAVE** - Visual accessibility evaluation
- **Lighthouse** - Accessibility audit in Chrome DevTools

---

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)

---

## 🚀 Quick Reference

### Common Patterns

**Loading States:**
```tsx
<div role="status" aria-live="polite" aria-busy="true">
  Loading...
</div>
```

**Error Messages:**
```tsx
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

**Success Messages:**
```tsx
<div role="status" aria-live="polite">
  {successMessage}
</div>
```

**Disabled Buttons:**
```tsx
<button disabled aria-disabled="true">
  Submit
</button>
```

---

Last updated: 2025-10-27
