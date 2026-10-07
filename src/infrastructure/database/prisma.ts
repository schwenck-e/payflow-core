import { PrismaClient } from "@prisma/client";

// Singleton instance do Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
let normalizedUrl = dbUrl;
if (dbUrl.startsWith("file:")) {
  const params: string[] = [];
  if (!dbUrl.includes("connection_limit")) params.push("connection_limit=1");
  if (!dbUrl.includes("timeout=")) params.push("timeout=20000");
  if (!dbUrl.includes("socket_timeout=")) params.push("socket_timeout=30");
  if (params.length > 0) {
    normalizedUrl = `${dbUrl}${dbUrl.includes("?") ? "&" : "?"}${params.join("&")}`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: normalizedUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
