
import dotenv from 'dotenv'

function configLoad() {
  dotenv.config()
}

configLoad()

type serverConfigType = {
  PORT: number
  DATABASE: string
  DATABASE_URL: string
  SUPABASE_URL: string
  SUPABASE_PUBLISHABLE_KEY: string
  SUPABASE_SECRET_KEY: string
  SUPABASE_JWKS_URL: string
  OPENAI_API_KEY: string
  GEMINI_API_KEY: string
  AI_PROVIDER: string
  EMBEDDING_DIMENSION: number
  NODE_ENV: string
  JWT_SECRET: string
  LOG_LEVEL: string
  FRONTEND_URL: string
}

export const serverConfig: serverConfigType = {
  PORT: Number(process.env.PORT) || 3000,
  DATABASE: process.env.DATABASE || process.env.DATABASE_URL || '',
  DATABASE_URL: process.env.DATABASE_URL || process.env.DATABASE || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || '',
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || '',
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
  EMBEDDING_DIMENSION: Number(process.env.EMBEDDING_DIMENSION) || 768,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
}
