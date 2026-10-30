import { z } from "zod";

// Server-side configuration, validated once on first use so a missing value
// fails loudly with a clear message instead of deep inside a library.
const schema = z.object({
  APP_URL: z.url().transform((url) => url.replace(/\/$/, "")),
  MONGODB_URI: z.string().startsWith("mongodb", "MONGODB_URI must be a MongoDB connection string"),
  // Optional: overrides the database named in MONGODB_URI (used by tests).
  MONGODB_DB: z.string().optional(),
  // Optional: comma-separated DNS servers for resolving mongodb+srv:// addresses,
  // for machines whose local resolver refuses SRV lookups (e.g. "1.1.1.1,8.8.8.8").
  MONGODB_DNS_SERVERS: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  // SMTP for invite and password-reset emails. When unset in development,
  // emails are printed to the server console instead.
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.coerce.number().optional(),
  EMAIL_USERNAME: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const problems = parsed.error.issues.map((issue) => `  ${issue.path.join(".")}: ${issue.message}`).join("\n");
      throw new Error(`Invalid environment configuration:\n${problems}\nSee .env.example.`);
    }
    cached = parsed.data;
  }
  return cached;
}
