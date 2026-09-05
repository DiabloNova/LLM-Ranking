{
  "name": "ai-branding-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "tsx scripts/generate-docs-data.ts && next build",
    "start": "next start",
    "lint": "eslint",
    "test:acquisition": "tsx tests/features/acquisition/run-all.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/core/database/migrator.ts",
    "db:push": "tsx scripts/database/db-push-guard.ts && drizzle-kit push",
    "test:all": "tsx scripts/test-all.ts",
    "test:visual": "playwright test"
  },
  "dependencies": {
    "@ai-sdk/google": "^4.0.24",
    "@base-ui/react": "^1.6.0",
    "@mendable/firecrawl-js": "^4.31.1",
    "@upstash/redis": "^1.38.2",
    "@vercel/analytics": "1.6.1",
    "@xyflow/react": "^12.11.2",
    "ai": "^7.0.37",
    "cheerio": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "dompurify": "^3.4.14",
    "drizzle-orm": "^0.45.2",
    "framer-motion": "^12.42.2",
    "html-to-text": "^10.0.0",
    "inngest": "^4.18.1",
    "lucide-react": "^1.26.0",
    "next": "16.2.11",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.10.1",
    "resend": "^6.25.0",
    "tailwind-merge": "^3.6.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/dompurify": "^3.2.0",
    "@types/html-to-text": "^9.0.4",
    "@types/node": "^20",
    "@types/pg": "^8.20.0",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "drizzle-kit": "^0.31.10",
    "eslint": "^9.39.5",
    "eslint-config-next": "16.2.11",
    "pg": "^8.22.0",
    "tailwindcss": "^4",
    "tsx": "^4.19.2",
    "typescript": "^5.9.3",
    "@playwright/test": "^1.52.0"
  },
  "packageManager": "pnpm@10.12.3",
  "pnpm": {
    "onlyBuiltDependencies": [
      "esbuild",
      "protobufjs",
      "sharp",
      "unrs-resolver"
    ]
  }
}
