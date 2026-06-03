import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), "../.env"), override: true });
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), override: true });

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.string().default("development"),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url(),
  BACKEND_URL: z.string().url(),
  GROQ_API_KEY: z.string().min(1),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  CHROMA_URL: z.string().url().optional(),
  CHROMA_HOST: z.string().optional(),
  CHROMA_API_KEY: z.string().optional(),
  CHROMA_TENANT: z.string().optional(),
  CHROMA_DATABASE: z.string().optional(),
  CHROMA_COLLECTION_NAME: z.string().default("project_management_templates"),
  N8N_PROJECT_PLANNING_WEBHOOK_URL: z.string().url().optional(),
  N8N_WEBHOOK_SECRET: z.string().optional()
});

export const env = schema.parse(process.env);
