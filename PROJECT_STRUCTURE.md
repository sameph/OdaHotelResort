ODA Hotel Resort - Project Folder Structure
============================================

📦 OdaHotelResort/
├── 📂 src/                                    # Source code
│   ├── 📂 routes/                            # Page routes (file-based routing)
│   │   ├── __root.tsx                        # Root layout wrapper
│   │   ├── index.tsx                         # Home page /
│   │   ├── about.tsx                         # About page
│   │   ├── rooms.tsx                         # Rooms listing
│   │   ├── dining.tsx                        # Dining showcase
│   │   ├── menu.tsx                          # Menu page ✨ NEW
│   │   ├── gallery.tsx                       # Image gallery
│   │   ├── events.tsx                        # Events page
│   │   ├── offers.tsx                        # Special offers
│   │   ├── book.tsx                          # Booking page
│   │   ├── contact.tsx                       # Contact form
│   │   ├── admin.tsx                         # Admin layout
│   │   ├── admin.index.tsx                   # Admin dashboard
│   │   ├── admin.menu.tsx                    # Menu management
│   │   ├── admin.rooms.tsx                   # Room management
│   │   ├── admin.bookings.tsx                # Booking management
│   │   ├── admin.contacts.tsx                # Contact submissions
│   │   ├── admin.gallery.tsx                 # Gallery management
│   │   ├── admin.guests.tsx                  # Guest management
│   │   ├── admin.offers.tsx                  # Offer management
│   │   ├── admin.analytics.tsx               # Analytics dashboard
│   │   └── README.md                         # Routing guide
│   │
│   ├── 📂 components/                        # Reusable React components
│   │   ├── site-header.tsx                   # Navigation header
│   │   ├── site-footer.tsx                   # Footer
│   │   ├── page-hero.tsx                     # Hero section
│   │   ├── section-heading.tsx               # Section titles
│   │   ├── reveal.tsx                        # Scroll animations
│   │   ├── booking-bar.tsx                   # Booking widget
│   │   ├── hero-carousel.tsx                 # Image carousel
│   │   ├── dining-experience.tsx             # Dining component
│   │   ├── admin-login.tsx                   # Admin login form
│   │   ├── admin-sidebar.tsx                 # Admin navigation
│   │   ├── language-switcher.tsx             # Language selector
│   │   └── 📂 ui/                            # Shadcn UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── accordion.tsx
│   │       ├── alert.tsx
│   │       ├── badge.tsx
│   │       ├── checkbox.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── popover.tsx
│   │       ├── sidebar.tsx
│   │       ├── sheet.tsx
│   │       ├── chart.tsx
│   │       ├── carousel.tsx
│   │       ├── drawer.tsx
│   │       ├── toggle.tsx
│   │       ├── tooltip.tsx
│   │       └── ... (20+ more UI components)
│   │
│   ├── 📂 lib/                               # Services & utilities
│   │   ├── supabase.ts                       # Supabase client init
│   │   ├── supabase-service.ts               # API functions
│   │   ├── supabase-types.ts                 # Types from DB
│   │   ├── email-service.ts                  # Resend emails
│   │   ├── chapa-service.ts                  # Chapa payments
│   │   ├── i18n.tsx                          # i18n (5 languages)
│   │   ├── utils.ts                          # Helper functions
│   │   ├── error-capture.ts                  # Error logging
│   │   ├── error-page.ts                     # Error rendering
│   │   └── lovable-error-reporting.ts        # Lovable integration
│   │
│   ├── 📂 hooks/                             # Custom React hooks
│   │   └── use-mobile.tsx                    # Mobile detection
│   │
│   ├── 📂 data/                              # Static data
│   │   └── rooms.ts                          # Room types
│   │
│   ├── 📂 assets/                            # Images
│   │   ├── hero-resort.jpg
│   │   ├── hero-2.jpg
│   │   ├── hero-3.jpg
│   │   ├── hero-4.jpg
│   │   ├── dining.jpg
│   │   ├── dining-hall.jpg
│   │   ├── coffee-ceremony.jpg
│   │   ├── pool.jpg
│   │   ├── events.jpg
│   │   ├── spa-hero.jpg
│   │   ├── spa.jpg
│   │   ├── room-*.jpg (6 room images)
│   │   └── (other images)
│   │
│   ├── router.tsx                            # Router setup
│   ├── routeTree.gen.ts                      # Auto-generated routes
│   ├── server.ts                             # SSR server wrapper
│   ├── start.ts                              # App entry point
│   └── styles.css                            # Global styles + Tailwind
│
├── 📂 supabase/                              # Database
│   ├── config.toml                           # Supabase config
│   ├── .gitignore
│   └── 📂 migrations/
│       ├── 20260727000000_create_hotel_inventory.sql
│       └── 20260918000000_food_menu.sql
│
├── 📂 public/                                # Static assets
│   ├── favicon.ico
│   └── chapa logo.png
│
├── 📂 .output/                               # Production build (generated)
│   ├── 📂 server/
│   │   ├── index.mjs                         # ⭐ Server entry point
│   │   ├── _runtime.mjs
│   │   ├── _tanstack-start-manifest.mjs
│   │   ├── 📂 _ssr/                          # Server-rendered components
│   │   ├── 📂 _libs/                         # Dependencies
│   │   └── 📂 _chunks/                       # Code chunks
│   ├── 📂 public/                            # Static files
│   │   ├── assets/
│   │   ├── _headers
│   │   ├── favicon.ico
│   │   └── chapa logo.png
│   ├── package.json
│   └── nitro.json
│
├── 📂 node_modules/                          # Dependencies (git ignored)
│   └── (100+ packages)
│
├── 📂 .tanstack/                             # Cache (git ignored)
├── 📂 .wrangler/                             # Wrangler config
├── 📂 .early.coverage/                       # Test coverage
│
├── ⚙️  Configuration Files
│   ├── package.json                          # Dependencies & scripts
│   ├── package-lock.json                     # Lock file
│   ├── tsconfig.json                         # TypeScript config
│   ├── vite.config.ts                        # Vite bundler config
│   ├── eslint.config.js                      # ESLint rules
│   ├── components.json                       # Shadcn UI config
│   ├── bunfig.toml                           # Bun package manager
│   ├── .prettierrc                           # Code formatter
│   ├── .prettierignore
│   └── .gitignore
│
├── 📋 Documentation
│   ├── AGENTS.md                             # Lovable info
│   ├── DEPLOYMENT_STRUCTURE.md               # Detailed structure
│   ├── CPANEL_DEPLOYMENT.md                  # cPanel guide
│   ├── QUICK_DEPLOY.md                       # Quick checklist
│   ├── .env.example                          # Environment template
│   └── show-structure.sh                     # This visualization
│
├── 📂 supabase_migrations/ (Root level)
│   ├── supabase_bookings_migration.sql
│   ├── supabase_contacts_migration.sql
│   ├── supabase_gallery_images_migration.sql
│   ├── supabase_journal_migration.sql
│   └── supabase_offers_migration.sql
│
└── 🧪 Test Files
    ├── test_db.js
    ├── test_db_2.js
    ├── test_db_3.js
    └── test_schema.js


📊 STATISTICS
=============

Routes: 15 page routes
  ├── 10 public pages (/, /rooms, /menu, /dining, /gallery, /events, /offers, /book, /contact, /about)
  └── 5 admin pages (/admin, /admin/menu, /admin/rooms, /admin/bookings, /admin/contacts, etc)

Components: 40+ components
  ├── 11 main components
  └── 30+ Shadcn UI components

Libraries & Services: 10+
  ├── Supabase (database, auth, storage)
  ├── Resend (email)
  ├── Chapa (payments)
  └── Others

UI Components: 30+ Shadcn UI components
  ├── Forms (button, input, select, checkbox, radio, etc)
  ├── Dialogs (dialog, alert, sheet, drawer)
  ├── Data (table, accordion, tabs)
  └── Utilities (card, badge, tooltip, etc)

Database:
  ├── 8 supabase tables
  ├── 2 migration files
  └── Auto-generated types

Languages: 5 supported
  ├── English (en)
  ├── Spanish (es)
  ├── French (fr)
  ├── Amharic (am)
  └── Oromiffa (om)


🔧 KEY FILES EXPLAINED
======================

package.json
  - npm dependencies and build scripts
  - Scripts: dev (dev server), build (production build), lint, format

src/routes/__root.tsx
  - Root layout that wraps all pages
  - Sets up providers, styles, global config

src/routes/index.tsx
  - HOME PAGE - Main landing page
  - Imports: hero carousel, rooms showcase, dining, events

src/routes/menu.tsx ✨ NEW
  - MENU PAGE for customers to view menu items
  - Imports menu data from Supabase
  - Features: category filtering, allergen info, featured items

src/router.tsx
  - Creates and configures the router
  - Sets up route context and query client

src/lib/supabase-service.ts
  - All database queries and API calls
  - Functions: fetchMenuItems, fetchRooms, fetchOffers, etc
  - Imported by: menu.tsx, rooms.tsx, gallery.tsx, etc

src/lib/i18n.tsx
  - Translation system for 5 languages
  - Imported by: site-header, all routes, all components

.env (NOT in repo)
  - Contains: SUPABASE_URL, SUPABASE_KEY, API keys
  - Must be created locally and on cPanel

vite.config.ts
  - Vite bundler configuration
  - Uses Lovable's TanStack config

tsconfig.json
  - TypeScript configuration
  - Sets up path aliases (@/ for src/)

.output/ (Production build)
  - Created by: npm run build
  - Used for: cPanel deployment
  - Entry point: .output/server/index.mjs


🚀 DEPLOYMENT FILES
===================

.output/server/index.mjs          ← Server runs from here
.output/public/                   ← Static files served from here
package.json                      ← Production dependencies
.env                              ← Environment variables


📱 RESPONSIVE DESIGN
====================

Mobile-first approach using Tailwind CSS
  - sm: > 640px
  - md: > 768px
  - lg: > 1024px
  - xl: > 1280px

Components adapt automatically using Tailwind breakpoints


🗄️ DATABASE STRUCTURE (Supabase)
=================================

Tables:
  ├── rooms - Hotel room listings
  ├── room_amenities - Room amenities
  ├── food_menu - Menu items ✨ NEW
  ├── bookings - Guest bookings
  ├── contacts - Contact form submissions
  ├── gallery_images - Gallery photos
  ├── journal_posts - Blog posts
  └── offers - Special offers


🎨 STYLING APPROACH
===================

Tailwind CSS + Custom CSS
  - Global styles in src/styles.css
  - Component styles inline with className
  - Design tokens: colors, spacing, typography
  - Dark mode support (custom theme)

Colors:
  ├── gold - Primary accent color
  ├── forest-deep - Primary dark color
  ├── background - Page background
  └── foreground - Text color

Typography:
  ├── Instrument Serif - Headings
  ├── Work Sans - Body text
  └── Cormorant Garamond - Elegant text


⚡ PERFORMANCE FEATURES
=======================

- Code splitting (automatic with TanStack Router)
- Image optimization
- Lazy loading
- CSS minification
- Gzip compression
- Server-side rendering (SSR)
- Static asset caching


🔐 SECURITY FEATURES
====================

- Environment variables (no hardcoded secrets)
- Supabase Row Level Security (RLS)
- Email verification (Resend)
- Secure payment processing (Chapa)
- CSRF protection (cPanel configuration)
- HTTPS/SSL (required for deployment)


🌍 INTERNATIONALIZATION (i18n)
===============================

Location: src/lib/i18n.tsx

Translations for 5 languages:
  - English (en) 🇬🇧
  - Spanish (es) 🇪🇸
  - French (fr) 🇫🇷
  - Amharic (am) 🇪🇹
  - Oromiffa (om) 🇪🇹

Usage:
  const { t } = useLang()
  t("nav.menu") → displays translated text


✅ BEST PRACTICES IMPLEMENTED
==============================

Code Organization:
  ✓ Feature-based folder structure
  ✓ Separation of concerns (components, services, hooks)
  ✓ Reusable components (DRY principle)
  ✓ Type-safe TypeScript throughout

Performance:
  ✓ Code splitting
  ✓ Lazy loading
  ✓ Image optimization
  ✓ Minimal bundle size

Developer Experience:
  ✓ Consistent formatting (Prettier)
  ✓ Linting (ESLint)
  ✓ Component library (Shadcn UI)
  ✓ Auto-generated routes
  ✓ Hot module replacement (HMR)

Maintainability:
  ✓ Clear file naming
  ✓ Modular components
  ✓ Documented code
  ✓ Type definitions
  ✓ Error handling


═══════════════════════════════════════════════════════════════

This structure supports:
- Fast development with Vite
- Type-safe development with TypeScript
- Scalable component architecture
- Easy deployment to cPanel
- Multi-language support
- Admin dashboard
- Database integration
- Payment processing
- Email notifications

═══════════════════════════════════════════════════════════════
