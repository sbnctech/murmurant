import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __clubosPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__clubosPrisma ??
  new PrismaClient({
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  global.__clubosPrisma = prisma;
}
