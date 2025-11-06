Rento UX/UI Audit Report
A) Executive Summary

Good foundation but inconsistent: Rento provides a functional rental marketplace with a modern Next.js architecture; however, visual consistency, validation logic and accessibility vary across pages.

Brand colors are under‑utilized: The palette (blue/green/yellow/dark) appears in some buttons and tags but many text elements default to grey, making the experience feel muted and inconsistent.

Forms need real validation: Listing creation has persistent error messages and mis‑wired number inputs; these bugs undermine confidence and should be resolved using robust form libraries and proper blur/onChange handlers.

Responsive layout mostly works: Cards and grids adjust across breakpoints but some elements (filters sidebar, hero search bar) overflow or leave awkward whitespace on small screens.

Messaging & profile flows exist: Internal messaging is well organized; however, single‑user demo content prevented sending to landlords. The profile page uses a dark theme inconsistent with other pages.

Accessibility gaps: Several texts and icons have insufficient contrast against light backgrounds
rento-h.vercel.app
, focus outlines are missing, and images lack meaningful alt attributes.

Dashboard clarity: Dashboard presents KPIs and listing cards clearly
rento-h.vercel.app
, but there are opportunities to reduce clutter and improve spacing.

Consistency in typography: Font sizes vary; headings sometimes appear too large or small relative to body text. Establishing a clear hierarchy will improve readability.

Micro‑interactions are minimal: Hover and focus states exist for some controls, but additional subtle animations (e.g., card hover lift) could enhance feedback without being intrusive.

Opportunity for polished branding: With consistent color usage, accessible contrast, refined spacing, and improved validation, Rento can evolve from a prototype to a production‑ready platform.

B) Scorecard
Category	Score (1–10)	Weight	Weighted	Rationale (1 line)
Colors (harmony/contrast)	6	0.15	0.90	Brand colors appear on buttons and tags but large portions of text/inputs use pale greys that fail contrast tests
rento-h.vercel.app
.
Typography (hierarchy)	6	0.15	0.90	Headings vary in size and weight; some pages (profile) use a different font style; lack of consistent spacing between headings and body.
Layout & Spacing	7	0.20	1.40	Overall layout is responsive and cards are well structured, but forms feel cramped and inconsistent margins exist between sections.
Responsiveness	8	0.15	1.20	Grid of listings and dashboard adjust gracefully; however, filter sidebar and hero search compress awkwardly on mobile.
Components & Interactions	6	0.15	0.90	Standard Tailwind components are used, but number inputs and select fields suffer from poor affordance and persistent error states.
Accessibility (AA+)	5	0.20	1.00	Multiple elements lack proper contrast and focus indicators; forms lack aria-* attributes and alt text is missing on images
rento-h.vercel.app
.
Overall	—	1.00	6.30/10	A solid MVP but needs polish: unify color & typography, fix validation, and enhance accessibility for a more professional feel.
C) Color & Typography Audit
Brand Palette Usage
Token	Intended Usage	Observations	Proposed Tailwind Utility
Blue #1E88E5	Primary call‑to‑action buttons, active links	Used on some buttons (e.g., Search homes on Home) but elsewhere replaced by light teal; headings often lack this accent.	Use bg-[#1E88E5] hover:bg-[#1565C0] text-white for all primary buttons.
Green #43A047	Success and tags	The Pet‑friendly tags use light green but not the specified shade; success toasts use different greens.	Define text-[#43A047] for success tags and bg-[#E8F5E9] backgrounds; unify toast styling.
Yellow #F9A825	Highlights / warnings	Rarely used; highlight call‑outs could use this color for labels or badges.	Apply bg-[#FFF8E1] text-[#F9A825] to info bars or NEW badges for better differentiation.
Dark #212121	Primary text	Many paragraphs default to grey (#6B7280) causing low contrast
rento-h.vercel.app
.	Use text-[#212121] for body text; text-slate-700 for secondary text to pass WCAG AA.
Background #F5F5F5	Page background	Some pages use pure white causing contrast issues with cards; the profile page uses a dark gradient unrelated to this palette
rento-h.vercel.app
.	Standardize backgrounds using bg-[#F5F5F5] for light sections and bg-[#212121] text-white for dark mode sections.
Typography Hierarchy

Headings: Use text-3xl font-bold for page titles, text-2xl font-semibold for section headers, and maintain consistent margins (mb-4) after headings.

Body text: Set base font size at text-base leading-relaxed across pages. The profile page uses smaller input labels; unify them with text-sm font-medium.

Buttons & Labels: Use font-medium rather than font-bold for button text to improve readability.

D) Page‑by‑Page UX Feedback
Home Page

Hero search bar: The search boxes are simple but placeholders have low contrast. Increase placeholder color to text-slate-500 and add clear focus ring (focus:ring-2 ring-[#1E88E5]/40).

Metrics cards: They are informative but lack visual hierarchy; make icons larger and apply subtle elevation (shadow-md). Use consistent border radius (rounded-xl).

Spotlight rentals carousel: At time of test no images were loaded; ensure there’s a fallback skeleton or sample images to illustrate this component.

Feature section: The three cards explaining the “renting game plan” are effective but the icons could adopt brand colors (blue, green, yellow) for differentiation.

Bottom CTA: Buttons “Explore listings” and “Join Rento” need stronger contrast; swap teal backgrounds with primary blue and add hover states.

Browse Page

Filter panel: Vertical sliders for budget are intuitive but the grey track fails contrast; use bg-slate-200 for tracks and bg-[#1E88E5] for handles. Provide numeric value feedback for ranges.

Toggle switches: Pet‑friendly and other toggles show low‑contrast labels; apply text-[#212121] and change knob color to blue when active for better affordance.

Grid cards: The new listing cards are colorful but the pink/green/blue backgrounds may confuse categories. Use consistent white card backgrounds with border colored tags (NEW, PET‑FRIENDLY) instead of colored panels.

Responsive behavior: On small screens the filter sidebar collapses; ensure there’s a clear button to open filters, and that the property cards become a single‑column list.

Property Detail Page

Image gallery: The hero section shows a single large purple placeholder for user‑uploaded images
rento-h.vercel.app
. Use a responsive carousel (e.g., Tailwind + Swiper) with thumbnails below and allow keyboard navigation. Ensure user images load correctly from Supabase.

Key facts: The “Key facts” box is useful; increase spacing between badges and apply consistent border radius and outline (bg-slate-50 p-2 rounded-md).

Message landlord CTA: Provide better feedback when user attempts to message themselves—currently it just shows a red error; disable the button or display tooltip before click.

Amenity icons: Use icons that match brand style; align them consistently and ensure each has alt text (e.g., aria-label="Laundry").

Dashboard

KPI cards: Good overview of active listings, applications, tours and unread messages
rento-h.vercel.app
. Use colors to indicate status (e.g., red if there are unread messages). Ensure numbers update when data changes.

Listing cards: Provide actions like Edit, Delete in a dropdown or icon; the “Manage” link is small. Include thumbnail images for quick identification.

Empty states: When there are no applications or tours, display friendly illustrations with guidance instead of plain text.

Button placement: The “New listing” button could be styled as a secondary CTA (outlined) to avoid competition with top navigation.

Add Listing Form

Validation bugs: Many fields show “required” errors even after input, and numeric spinners remain red
rento-h.vercel.app
. Use React Hook Form with a Zod schema to validate onChange and clear errors on blur. Example:

const schema = z.object({
  title: z.string().min(5),
  rent: z.number().positive(),
  beds: z.number().int().positive(),
  baths: z.number().int().positive(),
  // ...other fields
});

const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  mode: 'onBlur'
});

<input {...register('title')} className={clsx('input', errors.title && 'ring-2 ring-red-500')} />
{errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}


Number inputs: Replace native spinners with plain text inputs using type="number" and stepper buttons styled with Tailwind; this prevents persistent invalid states.

Select & toggle styling: Use headless UI Listbox for selects to ensure keyboard accessibility. Provide a visible focus state and close the list after selection.

Image upload: Show upload progress and preview thumbnails. Provide options to reorder and mark one as cover. Suggest using a grid preview with remove buttons.

Field grouping: Break the long form into sections with headers (e.g., “Basic info”, “Features & amenities”, “Photos”) to reduce cognitive load.

Messages

Conversation list: The left panel lists conversations but lacks a heading; add “Conversations” and use badges to indicate unread count.

Send box: Provide placeholder text hint (“Type your message…”) and a visible focus ring. Support keyboard shortcuts (Enter to send, Shift+Enter for newline) which are partly present.

Applicant actions: Buttons like “Verify” and “Request docs” should open modals; ensure they are disabled for demonstration accounts.

Empty state: When there are no messages, display a friendly illustration with instructions on how to initiate a conversation.

Profile

Dark theme inconsistency: The profile page uses a dark gradient that conflicts with the rest of the app
rento-h.vercel.app
. Either provide a dark mode toggle or align this page with the light theme.

Editable inputs: Fields become editable when clicking “Edit profile”, but there is no clear feedback; show inline input focus and validation.

Avatar upload: Include an option to upload/change profile picture with cropping and alt text.

Preferred contact: The segmented control is a nice touch; ensure proper ARIA roles (e.g., role="radiogroup" and role="radio").

E) Accessibility Observations

Color contrast: Several text elements (placeholder text, grey labels) fail WCAG AA contrast on light backgrounds
rento-h.vercel.app
. Use darker text colors or adjust background lightness.

Focus indicators: Inputs, buttons and toggles lack visible focus states; add focus:outline-none focus:ring-2 focus:ring-[#1E88E5] to interactive elements.

Semantic HTML: Use heading tags (<h1>, <h2>) for page titles instead of divs; ensures screen readers can navigate sections.

Form labels: Associate labels with inputs using <label htmlFor> and id; include aria-invalid when errors are present.

ARIA roles & attributes: Add role="button" for clickable divs, aria-live="polite" for status messages/toasts, and alt attributes for all images (e.g., property images, icons). Use descriptive alt text: “Exterior view of Spacious 3BR Family Home” instead of leaving it blank.

Keyboard navigation: Ensure dropdown lists and sliders can be operated via keyboard; use accessible libraries like Headless UI for Listbox/Select.

Skip links: Provide a “Skip to content” link at the top for keyboard users.

F) New Listings — What Happened

During testing I logged in with the provided landlord account and added three sample listings.

Cozy 2BR Near Downtown – Entered all fields and uploaded listing1.png. Initial validation errors persisted on required fields (title, beds, rent), but after carefully focusing each input the form allowed submission. The listing appeared on the dashboard and browse page with price $2,150
rento-h.vercel.app
.

Modern Studio With View – Filled details (rent $1,450, 1 bed, 1 bath, 450 sq ft) and selected amenities (balcony), pets allowed and no smoking. Uploaded listing2.png. The form saved correctly and the listing displayed on the dashboard and browse page
rento-h.vercel.app
.

Spacious 3BR Family Home – Entered 3 beds, 2 baths, area 1,800 sq ft, and selected House property type. Added description and uploaded listing3.png. Persistent error messages remained next to inputs but the listing still saved successfully. It appeared as an active listing with price $2,650
rento-h.vercel.app
.

Throughout the flow, the major issues were inconsistent validation (error messages not clearing) and poor affordance on number inputs/selects. Uploading images worked and previews rendered, but only one large purple placeholder showed on the property detail page
rento-h.vercel.app
.

G) Top 10 Quick Wins

Fix form validation – Implement React Hook Form + Zod for the listing form to ensure real‑time validation and clearing of errors; remove native number spinners and unify styling.

Improve color contrast – Change body text to dark grey (#212121) and placeholders to medium grey; update buttons to brand colors to meet contrast ratios.

Unify themes – Remove the dark gradient from the profile page or implement a consistent dark mode toggle across the app.

Add focus and hover states – Use Tailwind’s focus:ring, hover:bg-opacity-90 to show interactive feedback on all buttons, toggles, cards, and form fields.

Implement accessible dropdowns – Replace custom select elements with Headless UI Listbox to support keyboard navigation and proper ARIA roles.

Refactor property cards – Standardize card backgrounds to white with subtle shadows; move category tags to badges and use colored outlines instead of full‑panel tints.

Enhance messaging UI – Add headings and unread indicators in the conversation list; provide an empty‑state message and ensure send box shows focus state.

Provide skeleton loaders – Use skeleton components for images and cards while data loads (already present in some pages) but ensure consistent shapes and animations.

Add alt text & aria labels – Set meaningful alt texts for property images and icons; mark decorative icons as aria-hidden.

Optimize mobile experience – Collapse filter sidebar into a modal or drawer on small screens; ensure search and CTA buttons are thumb‑friendly.

H) Visual Improvement Mock Ideas

Listing Card Redesign – Use a white card with a border and a subtle drop shadow (shadow-sm hover:shadow-md transition-shadow). Place a large image thumbnail at the top (h-48 w-full object-cover rounded-t-lg) and stack the title, price, and badges below. Example Tailwind snippet:

<div className="rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
  <img src={coverUrl} alt={title} className="h-48 w-full object-cover rounded-t-lg" />
  <div className="p-4">
    <h3 className="text-lg font-semibold text-[#212121]">{title}</h3>
    <p className="text-sm text-slate-500">{city}</p>
    <div className="flex justify-between items-center mt-2">
      <span className="text-[#1E88E5] font-medium">${rent}/mo</span>
      <Badge variant="outline" color="green">Pet‑Friendly</Badge>
    </div>
  </div>
</div>


Multi‑step Listing Wizard – Split the add listing form into a wizard with steps: “Basic Info”, “Amenities & Policies”, “Media & Review”. Use a progress indicator and Next/Back buttons. This reduces cognitive load and encourages completion.

Image Carousel for Detail Page – Implement a responsive carousel with thumbnails and arrow navigation. Example using Swiper:

<Swiper className="w-full h-64" navigation pagination={{ clickable: true }}>
  {images.map((img) => (
    <SwiperSlide key={img.id}><img src={img.url} alt={img.alt} className="w-full h-full object-cover rounded-lg" /></SwiperSlide>
  ))}
</Swiper>


Top Navigation Improvement – Add an underline or pill indicator to show the current page; on mobile collapse the nav into a hamburger icon that opens a slide‑out menu. Use border-b-2 border-[#1E88E5] for the active link.

Dark Mode Support – Provide a toggle in the header using Tailwind’s dark classes. When dark mode is enabled, apply bg-[#212121], text-[#F5F5F5], and adjust cards to bg-[#2E2E2E] with lighter borders.

These improvements will deliver a polished, accessible, and consistent experience across the Rento platform.