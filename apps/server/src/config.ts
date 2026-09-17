import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load the monorepo root .env regardless of the process's current working directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  databaseUrl: requireEnv("DATABASE_URL"),
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || null,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || null,
  },
};
