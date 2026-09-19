# ODA Hotel Resort - Complete Folder & File Structure

## 📁 Source Code Structure (src/)

```
src/
├── routes/                          # Page routes (file-based routing)
│   ├── __root.tsx                  # Root layout wrapper
│   ├── index.tsx                   # Home page (/)
│   ├── about.tsx                   # About page (/about)
│   ├── rooms.tsx                   # Rooms page (/rooms)
│   ├── dining.tsx                  # Dining page (/dining)
│   ├── menu.tsx                    # Menu page (/menu) - NEW
│   ├── gallery.tsx                 # Gallery page (/gallery)
│   ├── events.tsx                  # Events page (/events)
│   ├── offers.tsx                  # Offers page (/offers)
│   ├── book.tsx                    # Booking page (/book)
│   ├── contact.tsx                 # Contact page (/contact)
│   ├── admin.tsx                   # Admin layout (/admin)
│   ├── admin.index.tsx             # Admin dashboard (/admin)
│   ├── admin.rooms.tsx             # Admin rooms manager (/admin/rooms)
│   ├── admin.menu.tsx              # Admin menu manager (/admin/menu)
│   ├── admin.bookings.tsx          # Admin bookings (/admin/bookings)
│   ├── admin.contacts.tsx          # Admin contacts (/admin/contacts)
│   ├── admin.gallery.tsx           # Admin gallery (/admin/gallery)
│   ├── admin.guests.tsx            # Admin guests (/admin/guests)
│   ├── admin.offers.tsx            # Admin offers (/admin/offers)
│   ├── admin.analytics.tsx         # Admin analytics (/admin/analytics)
│   └── README.md                   # Routing documentation
│
├── components/                      # Reusable React components
│   ├── site-header.tsx             # Top navigation bar
│   ├── site-footer.tsx             # Footer component
│   ├── page-hero.tsx               # Hero banner section
│   ├── section-heading.tsx         # Section title component
│   ├── reveal.tsx                  # Scroll reveal animation
│   ├── booking-bar.tsx             # Booking widget
│   ├── hero-carousel.tsx           # Image carousel
│   ├── dining-experience.tsx       # Dining showcase component
│   ├── admin-login.tsx             # Admin login form
│   ├── admin-sidebar.tsx           # Admin navigation sidebar
│   ├── language-switcher.tsx       # Multi-language selector
│   └── ui/                         # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── accordion.tsx
│       ├── alert.tsx
│       ├── badge.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── dropdown-menu.tsx
│       ├── popover.tsx
│       ├── sidebar.tsx
│       └── ... (20+ more UI components)
│
├── lib/                            # Utility functions & services
│   ├── supabase.ts                 # Supabase client initialization
│   ├── supabase-service.ts         # Supabase API calls
│   ├── supabase-types.ts           # TypeScript types from Supabase
│   ├── email-service.ts            # Email sending (Resend)
│   ├── chapa-service.ts            # Payment processing (Chapa)
│   ├── i18n.tsx                    # Internationalization (5 languages)
│   ├── utils.ts                    # Helper utilities
│   ├── error-capture.ts            # Error logging
│   ├── error-page.ts               # Error page rendering
│   └── lovable-error-reporting.ts  # Lovable error integration
│
├── hooks/                          # Custom React hooks
│   └── use-mobile.tsx              # Mobile responsiveness hook
│
├── data/                           # Static data
│   └── rooms.ts                    # Room type definitions
│
├── assets/                         # Images, icons, etc.
├── router.tsx                      # Router configuration
├── routeTree.gen.ts                # Auto-generated route tree
├── server.ts                       # Custom SSR error wrapper
├── start.ts                        # Application entry point
└── styles.css                      # Global styles & Tailwind

```

## 📦 Build Output Structure (.output/)

After running `npm run build`, the structure is:

```
.output/
├── server/                         # Server/SSR bundle (Nitro)
│   ├── index.mjs                  # Main server entry point
│   ├── _runtime.mjs               # Runtime utilities
│   ├── wrangler.json              # Cloudflare Workers config
│   ├── _chunks/                   # Server-side chunks
│   ├── _libs/                     # External dependencies
│   ├── _ssr/                      # Server-rendered components
│   │   ├── admin-*.mjs
│   │   ├── book-*.mjs
│   │   ├── menu-*.mjs            # Menu page component
│   │   ├── rooms-*.mjs
│   │   ├── dining-*.mjs
│   │   └── ... (all route components)
│   └── _tanstack-start-manifest.mjs
│
├── public/                         # Static assets (served directly)
│   ├── favicon.ico
│   ├── chapa logo.png
│   ├── _headers                    # HTTP headers config
│   └── assets/                     # Public images
│
├── package.json                    # Dependencies for production
├── package-lock.json               # Lock file
└── nitro.json                      # Nitro configuration

```

## 📂 Deployment Structure (cPanel public_html)

For cPanel deployment:

```
public_html/                         # Your cPanel web root
├── .output/                        # Deployed server build
│   ├── server/
│   │   ├── index.mjs              # ← Application entry point
│   │   ├── _chunks/
│   │   ├── _libs/
│   │   └── _ssr/
│   └── public/                     # Static files
│       ├── favicon.ico
│       ├── assets/
│       └── _headers
│
├── node_modules/                   # Production dependencies (optional)
│   └── ... (dependencies)
│
├── .htaccess                       # Reverse proxy configuration
├── .env                            # Environment variables
├── package.json
├── package-lock.json
└── ecosystem.config.js             # PM2 config (optional)

```

## 📋 Root Project Files

```
/home/sam/OdaHotelResort/
├── src/                           # Source code (see above)
├── supabase/                      # Database migrations
│   ├── migrations/
│   │   ├── 20260727000000_create_hotel_inventory.sql
│   │   └── 20260918000000_food_menu.sql
│   └── config.toml
│
├── public/                        # Static assets (dev only)
│   ├── chapa logo.png
│   └── favicon.ico
│
├── .output/                       # Production build (created by npm run build)
├── .env                           # Environment variables (not in git)
├── .gitignore                     # Git ignore rules
├── .prettierrc                    # Code formatter config
├── .prettierignore
├── eslint.config.js              # ESLint rules
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite bundler config
├── components.json               # Shadcn UI config
├── bunfig.toml                   # Bun package manager config
├── package.json                  # npm dependencies
├── package-lock.json             # Dependency lock file
├── AGENTS.md                     # Lovable dev notes
└── README.md                     # Project documentation

```

## 🌍 Deployment Checklist

### Before Deployment:

```
✓ .env file prepared with:
  - SUPABASE_URL
  - SUPABASE_KEY
  - DATABASE_URL (if needed)
  - NODE_ENV=production

✓ Build completed: npm run build

✓ Verify .output/ folder exists with:
  - .output/server/index.mjs
  - .output/public/ files
```

### Upload to cPanel:

```
Option 1: Direct folder upload
- Upload entire .output/ folder via FTP
- Upload package.json & package-lock.json
- Upload .env file

Option 2: Git deployment
- Clone repository to public_html
- Run: npm ci --production
- Run: npm run build
```

### Configure cPanel Node.js App:

```
Node.js Version: 18+ (preferably 20)
Application Root: /home/username/public_html
Application Startup File: .output/server/index.mjs
Application URL: yourdomain.com
Application Port: 3000 (or available port)
```

### Environment Variables in cPanel:

```
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your_anon_key
```

## 📊 File Count Summary

```
Source Files:
- Routes: 15 files
- Components: 40+ files
- Library utilities: 10 files
- Configuration: 8 files
- Supabase migrations: 2 SQL files

Total Lines of Code: ~15,000+
Languages: TypeScript, React, CSS, SQL

Build Output:
- Server bundle: ~22 KB (index.mjs)
- Total with dependencies: ~1.5 MB
- Gzipped: ~300-400 KB
```

## 🔗 Key File Relationships

```
index.tsx (Home)
  ├── imports: SiteHeader, SiteFooter, HeroCarousel, etc.
  ├── uses Supabase: fetchRooms, fetchOffers, fetchGallery
  └── renders: All major sections

routes/ (File-based routing)
  └── automatically creates URLs:
      /rooms → rooms.tsx
      /menu → menu.tsx ✨ NEW
      /admin/menu → admin.menu.tsx
      /admin → admin.tsx

lib/supabase-service.ts
  └── exports functions used by:
      - gallery.tsx
      - rooms.tsx
      - menu.tsx ✨ NEW
      - admin.menu.tsx
      - admin.rooms.tsx
      - etc.

lib/i18n.tsx
  └── provides translations for:
      - site-header.tsx
      - All routes
      - All components
```

## 🚀 Quick Deployment Command

```bash
# From your local machine:
cd /home/sam/OdaHotelResort
npm run build
tar -czf oda-deployment.tar.gz .output package.json package-lock.json

# Then upload oda-deployment.tar.gz to cPanel and extract
```

---

**Note**: The `/menu` route is newly added and automatically integrated into the routing system via file-based routing and translations.
