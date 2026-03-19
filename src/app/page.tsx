import { ArticleCard } from "@/components/ArticleCard";
import { Button } from "@/components/ui/Button";
import { Sparkles, TrendingUp, Clock, Star } from "lucide-react";

// Mock data for demonstration - in production this would come from the database
const mockArticles = [
  {
    id: "1",
    title: "The Rise of Multi-Agent AI Systems in 2026",
    subtitle: "How autonomous AI agent collaboration is reshaping software development",
    content: `The landscape of AI-assisted development has fundamentally shifted. What began as single-agent assistance has evolved into complex ecosystems where specialized AI agents collaborate, debate, and iteratively improve code together.

## Key Developments

Recent months have seen the emergence of sophisticated multi-agent frameworks that enable AI systems to work together with unprecedented coordination. These aren't mere tool calls between agents, but true collaborative workflows where different agents bring distinct perspectives and expertise.

### The Self-Evolution Capability

Perhaps the most significant advancement is the ability of AI systems to improve themselves. Systems like MiniMax M2.7 demonstrate the capacity to analyze their own performance, identify weaknesses, and dynamically optimize their approaches.

The implications for software development are profound. Imagine an AI that doesn't just write code, but actively improves its own coding methodology based on feedback from test results and code reviews.

## Industry Impact

Companies deploying these systems report dramatic improvements in development velocity. Tasks that previously required days of human effort can now be completed in hours, with the AI handling not just implementation but also testing, documentation, and iterative refinement.

The future of development isn't about AI replacing developers—it's about AI amplifiying human creativity and expertise through intelligent collaboration.`,
    authorName: "Nomi Vale",
    category: "AI & Technology",
    tags: ["AI", "Multi-Agent", "Development"],
    readTime: 8,
    publishedAt: new Date("2026-03-19T08:00:00"),
    coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
    isFavorite: true,
    isRead: false,
  },
  {
    id: "2",
    title: "Building a Self-Hosting Infrastructure for AI Agents",
    subtitle: "A practical guide to deploying and managing AI systems on your own hardware",
    content: `Self-hosting AI agents offers unparalleled control, privacy, and customization. This guide walks through the essential components of a robust AI infrastructure.

## The Foundation

A well-designed self-hosted AI setup begins with reliable hardware. The Raspberry Pi 5 with 16GB RAM provides an excellent starting point for development and testing, while more demanding workloads benefit from dedicated servers with GPU acceleration.

### Network Architecture

Modern AI deployments require thoughtful network design. Tailscale-based solutions enable secure access across devices while maintaining the benefits of local hosting.

## Management & Monitoring

The key to sustainable self-hosting is automation. Cron jobs, health checks, and automated updates keep systems running smoothly without constant manual intervention.

## Cost Analysis

Self-hosting isn't free, but it offers significant advantages over cloud alternatives for high-volume usage. The break-even point depends on usage patterns, but for power users, the control and flexibility often justify the investment.`,
    authorName: "Nomi Vale",
    category: "Infrastructure",
    tags: ["Self-Hosting", "OpenClaw", "Homelab"],
    readTime: 6,
    publishedAt: new Date("2026-03-18T14:30:00"),
    coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80",
    isFavorite: false,
    isRead: false,
  },
  {
    id: "3",
    title: "50 Trending GitHub Projects Analyzed",
    subtitle: "The most impactful open-source AI projects of the week, ranked by utility and innovation",
    content: `This week's GitHub trending projects reveal fascinating patterns in AI development tooling. From security sandboxing to autonomous research pipelines, the ecosystem continues to evolve rapidly.

## Security & Sandboxing

The emergence of tools like NemoClaw and Agent Safehouse signals a mature approach to AI security. These projects recognize that as AI agents become more powerful, the need for robust containment strategies grows.

## Developer Productivity

Projects like Code Review Graph and Lossless Claw address real pain points in developer workflows. Token efficiency and context management are becoming first-class concerns in AI-assisted development.

## Autonomous Systems

The line between tool and autonomous agent continues to blur. Projects enabling AI to iteratively improve code, run experiments overnight, and learn from failures represent the next frontier in AI-assisted development.`,
    authorName: "Nomi Vale",
    category: "Development",
    tags: ["GitHub", "Open Source", "AI Tools"],
    readTime: 10,
    publishedAt: new Date("2026-03-18T09:00:00"),
    coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&q=80",
    isFavorite: true,
    isRead: true,
  },
];

const categories = ["All", "AI & Technology", "Infrastructure", "Development", "Research"];
const filters = [
  { icon: TrendingUp, label: "Trending" },
  { icon: Clock, label: "Recent" },
  { icon: Star, label: "Favorites" },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white font-display">
            Good Evening, <span className="gradient-text">Ryan</span>
          </h1>
          <p className="mt-2 text-zinc-400">
            Your AI-curated news and insights are ready
          </p>
        </div>
        <Button variant="primary" size="lg">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Brief
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Articles", value: "24", change: "+5 today" },
          { label: "Links Saved", value: "156", change: "+12 today" },
          { label: "Voice Sessions", value: "8", change: "This week" },
          { label: "Reading Time", value: "3.2h", change: "Today" },
        ].map((stat) => (
          <div 
            key={stat.label}
            className="glass rounded-2xl p-6 hover:glow-hover transition-all duration-300"
          >
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
            <p className="text-xs text-violet-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-1">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <Button
                key={filter.label}
                variant={filter.label === "Trending" ? "primary" : "ghost"}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-2" />
                {filter.label}
              </Button>
            );
          })}
        </div>
        <div className="h-6 w-px bg-zinc-800" />
        <div className="flex items-center gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === "All" ? "secondary" : "ghost"}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      <div className="grid gap-6">
        {mockArticles.map((article, index) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ArticleCard article={article} featured={index === 0} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
