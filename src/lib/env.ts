import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().optional(),
  AUTH_JWT_SECRET: z.string().optional(),
  EMAIL_PROVIDER: z.string().optional(),
  SMS_PROVIDER: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}

export function requireDatabaseUrl(env: Env): string {
  if (!env.DATABASE_URL || env.DATABASE_URL.trim().length == 0) {
    throw new Error("DATABASE_URL is required for database operations");
  }
  return env.DATABASE_URL;
}
