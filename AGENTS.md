# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. Focus heavily on Server Components and Server Actions.
# AGENTS.md - Vertical Forest Dashboard (Master Blueprint)

## 1. Project Overview & Architecture
An Industrial IoT (IIoT) read-only monitoring dashboard for autonomous track-based watering robots. 
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Recharts (for Analytics)
- **Database:** PostgreSQL managed via Prisma ORM
- **Hardware Interface:** WebSerial API (Strictly for USB configuration upload, NO OTA)
- **Core Philosophy:** The robots are fully autonomous. The dashboard is a "Command Center" for monitoring and analytics ONLY.

## 2. Key Commands
- `npm install` - Install dependencies
- `npm run dev` - Start local development server
- `npm run build` - Build for production
- `npx prisma generate` - Update Prisma Client (Run after ANY schema changes)
- `npx prisma db push` - Sync Prisma schema to the local PostgreSQL database
- `npx prisma studio` - Open local database GUI
- `npm run lint` - Run ESLint checks

## 3. Strict Boundaries (Agent Directives)
### ✅ Allowed without asking
- Read files, analyze logs, list directory contents.
- Create or update UI components in `components/` that follow the design CI.
- Write or fix Prisma queries in Server Components or Server Actions.
### ⚠️ Ask first
- Installing or removing external npm packages.
- Modifying `prisma/schema.prisma` (Database structural changes).
- Deleting files or significantly restructuring folders.
### 🚫 Never
- NEVER commit secrets, `.env` files, or database credentials.
- NEVER generate mock data using hardcoded arrays; ALWAYS fetch from Prisma.
- NEVER create manual control functionality (e.g., joystick, move forward/back, manual watering) for the robots.

## 4. Non-Obvious Patterns & Core Logic
- **STRICT READ-ONLY UI:** Do not build forms or buttons that alter the robot's physical real-time movement. The dashboard displays states, it does not command them.
- **Hardware Config Mutation:** The ONLY hardware mutation allowed is compiling the database state (Robot -> Pot -> Plant) into a JSON payload and uploading it via the WebSerial API (USB) to the ESP32.
- **Data Model Hierarchy:** `Location` (1) -> `Robot` (N) | `Robot` (1) -> `Pot` (N).
- **The "1 Pot -> Many Plants" Rule:** The physical track index is represented by `pots`. A single `pot` can contain multiple `plants`. Logic must always account for arrays of plants within a pot.
- **Dual Logging System:**
  - `watering_logs`: For business logic/analytics (Plant-level). Must track `moisture_before`, `moisture_after`, and `water_amount_ml`. Status can be 'Success' or 'Skipped'.
  - `robot_logs`: For hardware state debugging (Robot-level). Must track discrete states like `WAKEUP`, `MOVING`, `WATERING`, `SLEEP`, `ERROR`.

## 5. Code Conventions & Style
- **Default to Server:** Use Next.js App Router conventions. Every page and component is a Server Component by default.
- **Client Components:** Add `"use client"` ONLY when strictly necessary (e.g., using Recharts, WebSerial API, `useState`, `useEffect`, or onClick event listeners). Keep client components as small as possible (Leaf components).
- **Server Actions:** Use Server Actions (`"use server"`) in the `actions/` directory for any database mutations (e.g., saving user settings or logging WebSerial sync events).
- **Styling (Vertical Forest CI):** Use Tailwind CSS exclusively. 
  - Primary Theme: Dark Forest Green (`#0E6633`)
  - Active/Positive Status: Pulse Green (`#22a042`)
  - Alerts/Errors: Destructive Red (`#ef4444`)
- **Type Safety:** ALWAYS explicitly define TypeScript types/interfaces for nested database relations (e.g., `RobotWithRelations`).

## 6. Security Considerations & Gotchas
- **CORS Policy:** Hardware (ESP32) pushing logs via HTTP POST might originate from different local IP networks. Ensure API routes in `app/api/` properly handle CORS headers if strict origins are not feasible.
- **API Protection:** Implement basic API Key validation in Next.js API Routes (`req.headers.get('x-api-key')`) to prevent unauthorized spam logging from rogue devices.
- **WebSerial Security:** The `navigator.serial` API requires a secure context. It works on `localhost` during development, but production environments MUST have an SSL/HTTPS certificate to function.

## 7. Deployment Steps
- The application is containerized using Docker. Ensure any new environment variables (`.env`) are explicitly documented for the `Dockerfile` and `docker-compose.yml` build processes.
- **Nginx** is used as a reverse proxy in production to handle SSL and route traffic. 
- Do not rely on Next.js standalone features that conflict with standard reverse proxy routing.
- Deployment command: `docker-compose up --build -d`

## 8. Git & Team Guidelines
- Follow Conventional Commits format to maintain a clean history:
  - `feat: add fleet monitoring UI`
  - `fix: resolve CORS issue on /api/logs`
  - `refactor: optimize Prisma query for analytics`
- Always verify Prisma schema with `npx prisma validate` before pushing code.

---

## APPENDIX A: Project Structure Reference
Maintain this exact folder structure to separate concerns effectively:

vertical-forest-dashboard
├── app
│   ├── (dashboard)         # Protected routes (Requires Auth/Admin)
│   ├── analytics       # KPI cards, Recharts (Line/Bar) for watering_logs
│   ├── dashboard       # Live status cards, Battery, Current Track
│   ├── setup           # WebSerial Config Upload tool
│   │   └── system-logs     # Data table with colored badges for robot_logs
│   ├── api                 # REST API endpoints for ESP32 log ingestion
│   ├── layout.tsx          # Main application shell (Sidebar, Topbar)
│   └── page.tsx            # Login or Redirect to /dashboard
├── actions                 # Server Actions (e.g., database mutations)
├── components
│   ├── ui                  # Reusable/Generic UI (Buttons, Inputs, Dialogs)
│   ├── charts              # Wrapper components for Recharts (Client)
│   └── fleet               # Domain-specific components (RobotCard, TrackView)
├── lib
│   ├── prisma.ts           # Singleton Prisma client instance
│   └── utils.ts            # Tailwind merge, date formatting (date-fns)
├── prisma
│   ├── schema.prisma       # Single source of truth for DB
│   └── seed.ts             # State-driven seeding script
├── tailwind.config.ts
└── package.json

## APPENDIX B: Code Style Examples

**❌ BAD: Client-side fetching for static DB data (Anti-Pattern)**
```tsx
"use client"
import { useEffect, useState } from 'react';

export default function FleetPage() {
    const [robots, setRobots] = useState([]);
    useEffect(() => {
        // Bad: Waterfall request, exposes API endpoint, slower load
        fetch('/api/robots').then(res => res.json()).then(setRobots);
    }, []);
    return <div>{robots.map(r => <p key={r.id}>{r.name}</p>)}</div>;
}
```

**✅ GOOD: Server Component directly using Prisma (Our Standard)**
```tsx
import prisma from '@/lib/prisma';
import { RobotCard } from '@/components/dashboard/RobotCard';

// Server Component: Fetches securely on the server, zero JS shipped to client for fetching
export default async function FleetPage() {
    // Note: Always use explicit include for relational data
    const robots = await prisma.robot.findMany({
        include: { 
            location: true,
            pots: { include: { plants: true } }
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-gray-50">
            {robots.map((robot) => (
                <RobotCard key={robot.id} data={robot} />
            ))}
        </div>
    );
}
```