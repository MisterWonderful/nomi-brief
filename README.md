# Nomi Brief

> Premium personal news and article delivery platform powered by AI agents

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)

## Features

- 📰 **Rich Article Delivery** - AI-generated articles with beautiful typography, images, and formatting
- 🎙️ **Voice Integration** - Speak directly with OpenClaw from any article
- 🔗 **Link Management** - Save, organize, and access external articles
- 🌙 **Dark Mode First** - Premium dark theme optimized for reading
- ⚡ **Real-time Updates** - Live content delivery and notifications
- 🔒 **Self-Hosted** - Complete control over your data

## Screenshots

[Add screenshots here]

## Quick Start

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 16+ (or use the included Docker setup)

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

3. **Start with Docker**
```bash
docker compose up -d
```

4. **Access the app**
- Open http://localhost:3000
- Configure OpenClaw webhook integration in Settings

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `OPENCLAW_URL` | OpenClaw instance URL | http://localhost:18789 |
| `OPENCLAW_TOKEN` | OpenClaw API token | Optional |
| `JWT_SECRET` | JWT signing secret | Required for production |
| `VOICE_ENABLED` | Enable voice features | true |

### OpenClaw Integration

To receive AI-generated articles:

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhook`
3. Configure OpenClaw cron to POST articles

Example webhook payload:
```json
{
  "title": "Article Title",
  "content": "Markdown content...",
  "subtitle": "Brief description",
  "category": "AI & Technology",
  "tags": ["AI", "News"],
  "coverImage": "https://..."
}
```

## Development

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16
- **Voice**: WebSocket-based real-time communication

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

### Database

```bash
# Open Prisma Studio
npm run db:studio

# Create migrations
npm run db:migrate

# Seed database
npm run db:seed
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Nomi Brief                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│  │   Next.js   │    │  WebSocket  │    │   OpenClaw  │    │
│  │  Frontend  │◄──►│   Server    │◄──►│   Agent     │    │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘    │
│         │                                      │           │
│         │         ┌─────────────┐              │           │
│         └────────►│ PostgreSQL  │◄─────────────┘           │
│                   │  Database   │                          │
│                   └─────────────┘                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Articles
- `GET /api/articles` - List articles
- `GET /api/articles/[id]` - Get article
- `POST /api/articles` - Create article
- `PATCH /api/articles/[id]` - Update article
- `DELETE /api/articles/[id]` - Delete article

### Links
- `GET /api/links` - List links
- `POST /api/links` - Save link
- `DELETE /api/links/[id]` - Delete link

### Voice
- `POST /api/voice/session` - Create voice session
- `GET /api/voice/session/[id]` - Get session status
- `POST /api/voice/session/[id]/end` - End session

### Webhook
- `POST /api/webhook` - Receive OpenClaw articles

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [OpenClaw](https://openclaw.ai/)
