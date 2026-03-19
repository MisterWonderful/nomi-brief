# Nomi Brief — Product Specification

> **Premium personal news and article delivery platform powered by AI**

---

## 1. Concept & Vision

Nomi Brief is a private, typography-first reading sanctuary designed for a single user (Ryan). It transforms AI-generated content, curated links, and personal notes into an elegant, magazine-quality reading experience. The platform feels like a premium publication—think *The New Yorker* meets a private research dashboard—where every interaction, from browsing the feed to speaking with the AI about an article, is intentional and refined.

The defining characteristic: **reading is a ritual, not a chore**. Dark mode dominates. Animations are smooth but never gratuitous. Voice integration feels like continuation of thought, not a feature bolted on.

---

## 2. Design Language

### 2.1 Aesthetic Direction

**Reference:** Editorial luxury meets terminal elegance. Think a blend of *Quartz*'s dark mode, *Linear*'s precision, and *Are.na*'s intellectual restraint.

### 2.2 Color Palette

| Role | Hex | Usage |
|------|-----|-------|
| **Background (Primary)** | `#0A0A0B` | Page backgrounds |
| **Background (Surface)** | `#141416` | Cards, panels, modals |
| **Background (Elevated)** | `#1C1C1F` | Hover states, dropdowns |
| **Border (Subtle)** | `#2A2A2E` | Dividers, card borders |
| **Border (Active)** | `#3D3D42` | Focus rings, active elements |
| **Text (Primary)** | `#FAFAFA` | Headlines, primary content |
| **Text (Secondary)** | `#A1A1A6` | Subtitles, metadata |
| **Text (Tertiary)** | `#6E6E73` | Timestamps, placeholders |
| **Accent (Primary)** | `#7C5CFF` | CTAs, links, active states |
| **Accent (Hover)** | `#9B82FF` | Hover states for accent |
| **Accent (Glow)** | `rgba(124, 92, 255, 0.15)` | Subtle glows, badges |
| **Success** | `#34C759` | Read status, success states |
| **Warning** | `#FF9F0A` | Favorites, starred items |
| **Error** | `#FF453A` | Error states, destructive actions |

### 2.3 Typography

**Primary Font:** `Inter` (weights: 400, 500, 600, 700)
**Monospace:** `JetBrains Mono` (code blocks, metadata)
**Fallbacks:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Article Title (H1) | 2.5rem | 700 | 1.2 | -0.02em |
| Section Title (H2) | 1.75rem | 600 | 1.3 | -0.01em |
| Card Title | 1.25rem | 600 | 1.4 | -0.01em |
| Body (Article) | 1.125rem | 400 | 1.8 | 0 |
| Body (UI) | 0.9375rem | 400 | 1.5 | 0 |
| Caption/Meta | 0.8125rem | 500 | 1.4 | 0.02em |
| Tag | 0.75rem | 500 | 1 | 0.04em |

### 2.4 Spacing System

Base unit: `4px`

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Icon gaps, tight spacing |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Small component padding |
| `space-4` | 16px | Standard component padding |
| `space-5` | 20px | Card padding |
| `space-6` | 24px | Section gaps |
| `space-8` | 32px | Large section gaps |
| `space-10` | 40px | Page section margins |
| `space-12` | 48px | Major section dividers |

### 2.5 Motion Philosophy

**Principle:** Motion communicates state, never decorates. Every animation has a purpose.

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Micro (hover, press) | 150ms | `ease-out` | Buttons, cards hover |
| Standard (modals, panels) | 250ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Modals, dropdowns |
| Entrance (page elements) | 400ms | `cubic-bezier(0.32, 0.72, 0, 1)` | Staggered card reveals |
| Page transition | 300ms | `ease-in-out` | Route changes |
| Voice waveform | continuous | sinusoidal | Audio visualization |

**Specific animations:**
- **Card hover:** `translateY(-4px)`, box-shadow increase, 150ms
- **Modal open:** Scale from 0.95 → 1, opacity 0 → 1, 250ms
- **Voice button pulse:** Subtle scale 1 → 1.05 → 1, infinite while active
- **Staggered feed:** Each card delays 50ms after previous (max 10 cards)

### 2.6 Visual Assets

- **Icons:** Lucide React (24px default, 20px compact, 16px inline)
- **Images:** Unsplash API for article cover images (via content source), placeholder gradient for missing images
- **Decorative:** Subtle gradient overlays on hero cards, grain texture on modal backgrounds (opacity 0.03)

---

## 3. Layout & Structure

### 3.1 Global Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────┐                          ┌─────────────┐  │
│  │    Logo      │     Navigation           │   Actions   │  │
│  │  "Nomi Brief"│     Feed | Links | ⚙️    │  Search 🔔  │  │
│  └──────────────┘                          └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Main Content                           │
│                   (varies by route)                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Status Bar: Connection status, last sync, voice   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

- **Header:** Fixed, 64px height, blur backdrop (`backdrop-filter: blur(12px)`)
- **Main content:** Max-width 1200px, centered, padding 24px
- **Status bar:** Fixed bottom, 48px, subtle border-top

### 3.2 Page Layouts

#### Home/Feed (`/`)
- Hero section: Latest article (large card, full-width)
- Category filter bar (horizontal scroll on mobile)
- Article grid: 2 columns desktop, 1 column mobile
- Infinite scroll with skeleton loading

#### Article View (`/article/[id]`)
- Full-width cover image (max-height: 50vh, object-fit: cover)
- Article header: Title, subtitle, author, date, read time, tags
- Article body: Max-width 720px, centered, generous margins
- Floating "Talk about this" button (bottom-right, fixed)
- Related articles section (below content)
- Share/bookmark actions (sticky sidebar on desktop)

#### Links (`/links`)
- Masonry grid of saved link cards
- Filter by tags
- Quick-preview on hover (optional expansion)

#### Settings (`/settings`)
- Two-column layout (nav sidebar + content panel)
- Sections: Profile, OpenClaw Connection, Appearance, Notifications

### 3.3 Responsive Strategy

| Breakpoint | Layout |
|------------|--------|
| Mobile (<640px) | Single column, bottom nav, collapsed header |
| Tablet (640-1024px) | 2-column grid, side nav hidden |
| Desktop (>1024px) | Full layout with sidebars |

---

## 4. Features & Interactions

### 4.1 Article Feed

**Card Display:**
- Cover image (aspect ratio 16:9, lazy loaded)
- Title (max 2 lines, ellipsis)
- Subtitle (max 3 lines, ellipsis)
- Author avatar + name
- Published date (relative: "2h ago", "Yesterday")
- Read time estimate
- Tags (max 3 visible)
- Read/Favorite status indicators

**Interactions:**
- Click card → navigate to `/article/[id]`
- Click tag → filter feed by tag
- Hover → subtle lift animation, border glow
- Mark as read → automatic on scroll past 80% or explicit click
- Favorite → click heart icon, optimistic update

**Filtering:**
- Category pills: All, Tech, News, Research, Personal
- Sort: Newest, Oldest, Read Time
- Search: Full-text search on title, subtitle, content

### 4.2 Article View

**Rich Content Rendering:**
- Markdown support via `react-markdown` with `remark-gfm`
- Syntax-highlighted code blocks (Prism.js, theme: VSCode Dark+)
- Responsive images with blur placeholder
- Embedded tweets/videos (oEmbed)
- External links open in new tab with icon indicator

**Article Header:**
- Cover image with gradient overlay for text legibility
- Title (H1), Subtitle (H2, text-secondary)
- Author: Avatar (32px) + "By [Name]"
- Metadata row: Published date, Read time, Category
- Tag list

**Actions:**
- Favorite toggle (heart icon, top-right)
- Mark as read/unread toggle
- Share (copy link, native share API if available)
- "Talk about this" → opens voice modal

### 4.3 Voice Integration ("Talk about this")

**Entry Point:**
- Floating action button (FAB), bottom-right, 56px diameter
- Icon: Microphone with sound waves
- Background: Accent color with subtle pulse animation when active
- Tooltip on hover: "Talk about this article"

**Modal Flow:**
1. Modal opens (scale + fade animation)
2. Audio permission prompt (if not granted)
3. Connection status indicator (connecting → connected)
4. Waveform visualization (real-time audio levels)
5. Transcript display (scrollable, latest at bottom)
6. End call button

**Technical Flow:**
1. Click FAB → `useVoice` hook initiates WebRTC connection
2. Context payload sent: `{ articleId, articleTitle, articleContent, userId }`
3. Audio stream established to OpenClaw voice-call plugin
4. Bidirectional audio streaming with real-time transcription
5. On end: session summary saved to `VoiceSession` table

**States:**
- Idle: FAB visible, muted colors
- Connecting: FAB pulsing, spinner overlay
- Connected: FAB accent glow, modal open
- Speaking: Waveform active, user transcript appearing
- Listening: Waveform active, AI transcript appearing
- Error: Error toast, retry button
- Ended: Modal shows summary, close button

**Error Handling:**
- Microphone denied → Show settings instructions
- Connection failed → Retry with exponential backoff (3 attempts)
- Session timeout (5 min) → Auto-end with summary
- Network disruption → Reconnect silently, queue audio

### 4.4 Links Page

**Link Entry Display:**
- Thumbnail image (or gradient placeholder)
- Title
- Domain favicon + hostname
- Saved date
- Tags
- Read/Favorite status

**Interactions:**
- Click → Opens URL in new tab
- Long press/right-click → Context menu (Mark read, Favorite, Delete)
- Hover → Preview card with description

**Import Sources:**
- Manual URL entry
- Karakeep webhook integration
- RSS feed aggregation (future)
- Browser extension (future)

### 4.5 Settings Page

**Profile Section:**
- Avatar (upload or URL)
- Display name
- Email (read-only, for notifications)
- Bio (optional)

**OpenClaw Connection:**
- Gateway URL (default: auto-detect from environment)
- API key (masked input)
- Connection status indicator (Connected/Disconnected/Error)
- Test connection button

**Appearance:**
- Theme toggle: Dark (default) / Light / System
- Font size slider: 14px – 20px
- Reduced motion toggle

**Notifications:**
- Email digest toggle (daily/weekly)
- New article push toggle
- Voice session summaries toggle

---

## 5. Component Inventory

### 5.1 Navigation (`Navigation.tsx`)

| State | Appearance |
|-------|------------|
| Default | Logo left, nav links center, actions right. Background: transparent |
| Scrolled | Background: surface color with blur. Border-bottom: subtle |
| Mobile | Hamburger menu, slide-out drawer |

### 5.2 Article Card (`ArticleCard.tsx`)

| State | Appearance |
|-------|------------|
| Default | Surface background, subtle border, no shadow |
| Hover | Elevated background, border-active, translateY(-4px), shadow |
| Unread | Left accent border (4px, accent color) |
| Read | Left accent border removed, slightly dimmed |
| Favorite | Heart icon filled (warning color) |

### 5.3 Article Content (`ArticleContent.tsx`)

| State | Appearance |
|-------|------------|
| Loading | Skeleton lines (varying widths) |
| Rendered | Full markdown with syntax highlighting |
| Error | Error message with retry button |

### 5.4 Voice Button (`VoiceButton.tsx`)

| State | Appearance |
|-------|------------|
| Idle | Microphone icon, surface background, subtle border |
| Hover | Accent background, scale(1.05) |
| Active (connecting) | Pulsing animation, spinner overlay |
| Speaking | Sound wave animation, accent glow |
| Error | Red tint, exclamation icon |

### 5.5 Voice Modal (`VoiceModal.tsx`)

| State | Appearance |
|-------|------------|
| Opening | Scale 0.95→1, opacity 0→1, backdrop fade |
| Connecting | Centered spinner, "Connecting to Nomi..." |
| Connected | Waveform visualization, transcript area, end button |
| Speaking | User speech bubble (right), AI speech bubble (left) |
| Error | Error icon, message, retry/close buttons |
| Closing | Scale 1→0.95, opacity 1→0 |

### 5.6 Link Card (`LinkCard.tsx`)

| State | Appearance |
|-------|------------|
| Default | Compact card, thumbnail left, content right |
| Hover | Elevated, slight scale |
| Unread | Accent dot indicator |
| Favorite | Star icon filled |

### 5.7 UI Components (`ui/`)

- **Button:** Variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading state
- **Input:** Default, focus, error, disabled states
- **Select:** Custom dropdown with search
- **Tag:** Colored pill with optional remove button
- **Toast:** Success/error/warning/info variants, auto-dismiss
- **Skeleton:** Shimmer animation for loading states
- **Modal:** Backdrop blur, centered content, close button
- **Tooltip:** Dark background, arrow pointer

---

## 6. Technical Approach

### 6.1 Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS v3 + custom CSS variables |
| Animation | Framer Motion |
| Database | PostgreSQL 15+ |
| ORM | Prisma |
| Auth | JWT (future multi-user) / Session (current single-user) |
| Real-time | WebSocket (ws library) |
| Voice | WebRTC (native browser APIs) |
| Markdown | react-markdown + remark-gfm + rehype-prism-plus |
| State | React Context + useReducer (lightweight) |
| Icons | Lucide React |

### 6.2 Project Structure

```
nomi-brief/
├── SPEC.md
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── .env.example
├── .env.local (gitignored)
├── docker-compose.yml
├── Dockerfile
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── favicon.ico
│   └── images/
│       └── og-default.png
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx (redirects to /feed)
    │   ├── globals.css
    │   ├── feed/
    │   │   └── page.tsx
    │   ├── article/
    │   │   └── [id]/
    │   │       └── page.tsx
    │   ├── links/
    │   │   └── page.tsx
    │   ├── settings/
    │   │   └── page.tsx
    │   └── api/
    │       ├── articles/
    │       │   ├── route.ts (GET all, POST create)
    │       │   └── [id]/
    │       │       ├── route.ts (GET one, PATCH, DELETE)
    │       │       └── read/route.ts (POST mark read)
    │       ├── links/
    │       │   ├── route.ts
    │       │   └── [id]/
    │       │       └── route.ts
    │       ├── voice/
    │       │   ├── session/route.ts (POST create session)
    │       │   ├── status/route.ts (GET session status)
    │       │   └── ws/route.ts (WebSocket upgrade)
    │       ├── webhook/
    │       │   └── route.ts (OpenClaw content submission)
    │       └── settings/
    │           └── route.ts
    ├── components/
    │   ├── layout/
    │   │   ├── Navigation.tsx
    │   │   ├── Header.tsx
    │   │   └── StatusBar.tsx
    │   ├── articles/
    │   │   ├── ArticleCard.tsx
    │   │   ├── ArticleContent.tsx
    │   │   ├── ArticleGrid.tsx
    │   │   └── ArticleHeader.tsx
    │   ├── voice/
    │   │   ├── VoiceButton.tsx
    │   │   ├── VoiceModal.tsx
    │   │   ├── VoiceProvider.tsx
    │   │   └── WaveformVisualizer.tsx
    │   ├── links/
    │   │   ├── LinkCard.tsx
    │   │   └── LinkGrid.tsx
    │   ├── settings/
    │   │   ├── SettingsNav.tsx
    │   │   └── SettingsSection.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Input.tsx
    │       ├── Select.tsx
    │       ├── Tag.tsx
    │       ├── Toast.tsx
    │       ├── Skeleton.tsx
    │       ├── Modal.tsx
    │       └── Tooltip.tsx
    ├── hooks/
    │   ├── useVoice.ts
    │   ├── useArticles.ts
    │   ├── useLinks.ts
    │   └── useSettings.ts
    ├── lib/
    │   ├── prisma.ts
    │   ├── openclaw.ts (OpenClaw API client)
    │   ├── utils.ts
    │   └── constants.ts
    ├── types/
    │   └── index.ts
    └── context/
        ├── VoiceContext.tsx
        └── SettingsContext.tsx
```

### 6.3 Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  avatar        String?
  bio           String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  settings      Settings?
  articles      Article[]
  links         LinkEntry[]
  voiceSessions VoiceSession[]
}

model Settings {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme             String   @default("dark")
  fontSize          Int      @default(16)
  reducedMotion     Boolean  @default(false)
  emailDigest       Boolean  @default(false)
  digestFrequency   String   @default("weekly")
  pushNotifications Boolean  @default(true)
  voiceSummaries    Boolean  @default(true)
  openclawUrl       String?
  openclawApiKey    String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Article {
  id           String    @id @default(cuid())
  title        String
  subtitle     String?
  content      String    @db.Text
  authorName   String    @default("Nomi")
  authorAvatar String?
  coverImage   String?
  category     String    @default("General")
  tags         String[]
  readTime     Int       @default(5)
  source       String    @default("ai") // "ai" | "rss" | "manual" | "github"
  sourceUrl    String?
  publishedAt  DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  isRead       Boolean   @default(false)
  isFavorite   Boolean   @default(false)
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  links        LinkEntry[]
  voiceSessions VoiceSession[]
}

model LinkEntry {
  id          String    @id @default(cuid())
  title       String
  url         String
  description String?
  image       String?
  hostname    String?
  tags        String[]
  savedAt     DateTime  @default(now())
  isRead      Boolean   @default(false)
  isFavorite  Boolean   @default(false)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  articleId   String?
  article     Article?  @relation(fields: [articleId], references: [id], onDelete: SetNull)
}

model VoiceSession {
  id          String    @id @default(cuid())
  articleId   String
  article     Article   @relation(fields: [articleId], references: [id], onDelete: Cascade)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      String    @default("active") // "active" | "completed" | "failed"
  transcript  Json?
  summary     String?
  startedAt   DateTime  @default(now())
  endedAt     DateTime?
}
```

### 6.4 API Endpoints

#### Articles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/articles` | List articles (pagination, filters) |
| POST | `/api/articles` | Create article (from OpenClaw webhook) |
| GET | `/api/articles/[id]` | Get single article |
| PATCH | `/api/articles/[id]` | Update article (favorite, read status) |
| DELETE | `/api/articles/[id]` | Delete article |
| POST | `/api/articles/[id]/read` | Mark as read |

#### Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/links` | List link entries |
| POST | `/api/links` | Create/save link entry |
| PATCH | `/api/links/[id]` | Update link entry |
| DELETE | `/api/links/[id]` | Delete link entry |

#### Voice

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/session` | Create voice session |
| GET | `/api/voice/status` | Get session status |
| WS | `/api/voice/ws` | WebSocket for real-time voice |

#### Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | OpenClaw content submission |
| GET | `/api/webhook` | Verify webhook (GET with challenge) |

#### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update settings |

### 6.5 OpenClaw Integration

**Webhook Endpoint (`POST /api/webhook`):**

Request from OpenClaw:
```json
{
  "type": "article",
  "payload": {
    "title": "...",
    "subtitle": "...",
    "content": "...",
    "coverImage": "...",
    "category": "...",
    "tags": ["..."],
    "source": "ai"
  }
}
```

**Voice Connection:**

The WebRTC signaling goes through OpenClaw's voice-call plugin:
1. Client initiates WebRTC offer
2. Offer sent to `/api/voice/session` which proxies to OpenClaw
3. OpenClaw returns ICE candidates and SDP answer
4. Direct peer-to-peer audio established
5. Session context includes article content

**Environment Variables:**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/nomibrief
OPENCLAW_URL=https://openclaw.unschackle.com
OPENCLAW_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.6 Docker Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://nomi:nomipass@db:5432/nomibrief
      - OPENCLAW_URL=${OPENCLAW_URL}
      - OPENCLAW_API_KEY=${OPENCLAW_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=nomi
      - POSTGRES_PASSWORD=nomipass
      - POSTGRES_DB=nomibrief
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  pgdata:
```

**Dockerfile:**
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 7. Quality Standards

### 7.1 Error Handling
- All API routes return consistent error format: `{ error: string, code: string, details?: any }`
- Client-side errors caught by error boundaries at page level
- Toast notifications for user-facing errors
- Console logging with levels (error, warn, info) for debugging

### 7.2 Loading States
- Skeleton components for initial page loads
- Spinner overlay for async user actions
- Optimistic updates for favoriting/marking read
- Progressive loading for article content

### 7.3 Accessibility
- Semantic HTML (`<article>`, `<nav>`, `<main>`, `<aside>`)
- ARIA labels for interactive elements
- Keyboard navigation (Tab, Enter, Escape)
- Focus visible states
- Skip to content link
- Reduced motion support

### 7.4 Performance
- Image optimization via `next/image`
- Code splitting by route
- ISR for static pages where applicable
- Database indexes on `publishedAt`, `userId`, `category`
- Virtual scrolling for long lists (if >50 items)

### 7.5 Security
- Environment variables for secrets
- CSRF protection on mutations
- Input sanitization for markdown content
- Rate limiting on webhook endpoint
- SQL injection prevention via Prisma

---

## 8. Future Considerations (Out of Scope for v1)

- Multi-user support with role-based access
- Collaborative annotation on articles
- Reading progress sync across devices
- Browser extension for quick-save
- Email newsletter generation
- Text-to-speech for articles (native)
- Pocket/Instapaper integration
- Social sharing features

---

*Last updated: 2026-03-19*
