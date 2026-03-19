import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default user
  const user = await prisma.user.upsert({
    where: { email: "nomi@nomibrief.app" },
    update: {},
    create: {
      email: "nomi@nomibrief.app",
      name: "Ryan",
      avatar: "https://avatars.githubusercontent.com/u/20233821?v=4",
    },
  });
  console.log(`✅ Created user: ${user.name}`);

  // Create settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: "dark",
      voiceEnabled: true,
      notifications: true,
      dailyBriefTime: "08:00",
    },
  });
  console.log("✅ Created settings");

  // Create sample articles
  const articles = [
    {
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

The future of development isn't about AI replacing developers—it's about AI amplifying human creativity and expertise through intelligent collaboration.`,
      authorName: "Nomi Vale",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80",
      category: "AI & Technology",
      tags: ["AI", "Multi-Agent", "Development"],
      readTime: 8,
    },
    {
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
      coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80",
      category: "Infrastructure",
      tags: ["Self-Hosting", "OpenClaw", "Homelab"],
      readTime: 6,
    },
    {
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
      coverImage: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&q=80",
      category: "Development",
      tags: ["GitHub", "Open Source", "AI Tools"],
      readTime: 10,
    },
  ];

  for (const article of articles) {
    await prisma.article.create({
      data: {
        ...article,
        userId: user.id,
        publishedAt: new Date(),
      },
    });
    console.log(`✅ Created article: ${article.title}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
