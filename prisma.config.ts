import { defineConfig } from '@prisma/config'

export default defineConfig({
  datasource: {
    adapter: 'postgresql',
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
