import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Helper to get the default user email from env, with fallback
export function getDefaultUserEmail(): string {
  return process.env.DEFAULT_USER_EMAIL || "nomi@nomibrief.app";
}

// Helper to upsert the default user
export async function upsertDefaultUser() {
  return prisma.user.upsert({
    where: { email: getDefaultUserEmail() },
    update: {},
    create: {
      email: getDefaultUserEmail(),
      name: process.env.DEFAULT_USER_NAME || "Ryan",
      avatar:
        process.env.DEFAULT_USER_AVATAR ||
        "https://avatars.githubusercontent.com/u/20233821?v=4",
    },
  });
}
