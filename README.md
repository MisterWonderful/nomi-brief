# Nomi Brief

> Personal news and article delivery platform powered by AI agents

## Current State

This is a **work in progress** project. The following features are implemented:

### Implemented ✅
- [x] Next.js 15 with App Router
- [x] PostgreSQL database with Prisma ORM
- [x] Dark theme UI with TailwindCSS and Framer Motion
- [x] Article management (create, list, view)
- [x] Webhook endpoint for receiving articles from OpenClaw (`POST /api/webhook`)
- [x] API authentication via `API_SECRET` environment variable (required, no fallback)
- [x] Docker and Docker Compose deployment
- [x] Responsive navigation with articles listing page
- [x] Article detail pages with full markdown rendering (GFM + syntax highlighting)
- [x] Links page (stub, saves articles from webhooks)

### Partially Implemented 🔄
- [ ] Voice integration ("Talk about this") - UI exists but backend not wired
- [ ] Settings page - basic stub UI only
- [ ] Bookmark/favorite toggle functionality
- [ ] User authentication (currently single-user mode)

### Planned 📋
- [ ] Complete voice feature with OpenClaw integration
- [ ] User settings and preferences
- [ ] Daily brief generation
- [ ] Link bookmarking and organization
- [ ] Full-text search
- [ ] Email digest notifications

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Container**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 16+ (included in Docker Compose)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MisterWonderful/nomi-brief.git
cd nomi-brief
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start with Docker Compose**
```bash
docker compose up -d
```

4. **Initialize the database**
```bash
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed
```

5. **Access the app**
- Open http://localhost:3000

## Development

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `API_SECRET` | Secret for API authentication | Yes (for POST /api/articles) |
| `OPENCLAW_URL` | OpenClaw instance URL | No |
| `OPENCLAW_TOKEN` | OpenClaw API token | No |
| `JWT_SECRET` | JWT signing secret | No |

## API Endpoints

### Articles
- `GET /api/articles` - List articles (supports pagination, filtering)
- `POST /api/articles` - Create article (requires `Authorization: Bearer ${API_SECRET}`)

### Webhook
- `GET /api/webhook` - Verify webhook endpoint
- `POST /api/webhook` - Receive articles from OpenClaw (accepts `article` type payload)

Example webhook payload:
```json
{
  "type": "article",
  "payload": {
    "title": "Article Title",
    "content": "Markdown content...",
    "subtitle": "Brief description",
    "category": "AI & Technology",
    "tags": ["AI", "News"],
    "coverImage": "https://..."
  }
}
```

## Docker

The Dockerfile builds a multi-stage image:
1. Install dependencies
2. Build the Next.js app
3. Create production image

```bash
# Build image
docker build -t nomi-brief .

# Run container
docker run -p 3000:3000 --env-file .env nomi-brief
```

## Project Structure

```
nomi-brief/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/route.ts
│   │   │   └── webhook/route.ts
│   │   ├── articles/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ArticleCard.tsx
│   │   ├── Navigation.tsx
│   │   └── ui/Button.tsx
│   └── lib/
│       ├── prisma.ts
│       ├── utils.ts
│       └── types.ts
├── prisma/
│   └── schema.prisma
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## License

MIT License
