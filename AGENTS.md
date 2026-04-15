# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. Focus heavily on Server Components and Server Actions.
# AGENTS.md - Vertical Forest Dashboard (Master Blueprint V3: OTA & RBAC)

## 1. Project Overview & Architecture
An Industrial IoT (IIoT) read-only monitoring dashboard for autonomous track-based watering robots. 
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + Recharts (for Analytics)
- **Database:** PostgreSQL managed via Prisma ORM
- **Hardware Interface:** OTA (Over-The-Air) configuration via HTTP Polling or MQTT (Replaced WebSerial).
- **Core Philosophy:** The robots are fully autonomous. The dashboard is a "Command Center" for monitoring, analytics, and centralized configuration management.

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
- Implement UI filters (e.g., Robot ID dropdowns in Analytics).
### ⚠️ Ask first
- Installing or removing external npm packages.
- Modifying `prisma/schema.prisma` (Database structural changes).
- Deleting files or significantly restructuring folders.
### 🚫 Never
- NEVER commit secrets, `.env` files, or database credentials.
- NEVER generate mock data using hardcoded arrays; ALWAYS fetch from Prisma.
- NEVER create manual control functionality (e.g., joystick, move forward/back, manual watering) for the robots.
- NEVER bypass RBAC checks. All data fetching MUST respect the user's role and assigned zone.

## 4. Non-Obvious Patterns & Core Logic
- **STRICT READ-ONLY UI:** Do not build forms or buttons that alter the robot's physical real-time movement. The dashboard displays states, it does not command them.
- **Hardware Config Mutation (OTA):** Configuration is saved directly to PostgreSQL. The ESP32 will use HTTP Polling (e.g., `GET /api/config?robot_id=XYZ`) to fetch its assigned configuration.
- **Role-Based Access Control (RBAC):**
  - **SUPER Admin:** Full access to all data, all zones (Locations), and user management.
  - **Admin:** Restricted access. Can ONLY view and manage data related to their assigned `zone_id` (Location).
- **Plant Master Data (PlantTemplate):** The system relies on a master configuration for plants. When configuring a robot's pot, the user CANNOT type a custom plant name. They MUST select from a dropdown populated by the `PlantTemplate` table (which stores Target Moisture, Flowrate, etc.).
- **Data Model Hierarchy:** - `User` (1) -> `Location/Zone` (1)
  - `Location` (1) -> `Robot` (N) -> `Pot` (N) -> `Plant` (N).
  - `PlantTemplate` (Master Data).
- **Analytics Constraints:** - Must include a Robot filter (Dropdown/Checkbox) to view specific or all robots.
  - Water usage calculation (ML) is derived from `Flowrate * Time`. Always add a UI note under the chart: *"ค่า ML ที่แสดงคือค่าเปรียบเทียบจากการคำนวณ (เวลา x Flowrate)"*.

## 5. Code Conventions & Style
- **Default to Server:** Use Next.js App Router conventions. Every page and component is a Server Component by default.
- **Client Components:** Add `"use client"` ONLY when strictly necessary (e.g., using Recharts, `useState`, `useEffect`, or onClick event listeners). Keep client components as small as possible.
- **Server Actions:** Use Server Actions (`"use server"`) in the `actions/` directory for any database mutations (e.g., CRUD for PlantTemplates, User assignments, Robot config).
- **Styling (Vertical Forest CI):** Use Tailwind CSS exclusively. 
  - Primary Theme: Dark Forest Green (`#0E6633`)
  - Active/Positive Status: Pulse Green (`#22a042`)
  - Alerts/Errors: Destructive Red (`#ef4444`)
- **Type Safety:** ALWAYS explicitly define TypeScript types/interfaces for nested database relations.

## 6. Security Considerations & Gotchas
- **Route Protection:** Use Next.js Middleware (`middleware.ts`) to protect dashboard routes and redirect unauthorized users to login.
- **Application-Level Row Security:** Prisma queries MUST append `where: { location_id: user.zone_id }` if the user is an Admin.
- **CORS Policy:** Hardware (ESP32) fetching OTA configs requires proper CORS headers in Next.js API Routes.
- **API Protection:** Implement basic API Key validation in Next.js API Routes to prevent unauthorized spam logging from rogue devices.

## 7. Deployment Steps
- The application is containerized using Docker. Ensure any new environment variables (`.env`) are explicitly documented for the `Dockerfile` and `docker-compose.yml`.
- **Nginx** is used as a reverse proxy in production to handle SSL and route traffic. 
- Deployment command: `docker-compose up --build -d`

## 8. Git & Team Guidelines
- Follow Conventional Commits format to maintain a clean history.
- Always verify Prisma schema with `npx prisma validate` before pushing code.

---

## APPENDIX A: Project Structure Reference
Maintain this exact folder structure to separate concerns effectively:

vertical-forest-dashboard
├── app
│   ├── (dashboard)         # Protected routes (Requires Auth/Admin)
│   │   ├── analytics       # KPI charts with Robot Dropdown filters
│   │   ├── dashboard       # Live status cards (Zone-restricted)
│   │   ├── setup-robot     # Robot configuration (Uses PlantTemplate dropdowns)
│   │   ├── plant-config    # CRUD page for Plant Master Data
│   │   ├── user-management # SUPER ADMIN ONLY: Assign roles and zones
│   │   └── system-logs     # Data table with colored badges for robot_logs
│   ├── api                 
│   │   ├── config          # OTA Endpoint for ESP32 to fetch config
│   │   └── logs            # REST API endpoints for ESP32 log ingestion
│   ├── layout.tsx          
│   └── page.tsx            
├── actions                 # Server Actions (Protected by RBAC checks)
├── components
│   ├── ui                  # Reusable/Generic UI
│   ├── charts              # Wrapper components for Recharts (Client)
│   └── forms               # Setup and CRUD forms
├── lib
│   ├── prisma.ts           # Singleton Prisma client instance
│   └── utils.ts            
├── middleware.ts           # Handles authentication and RBAC routing
├── prisma
│   ├── schema.prisma       
│   └── seed.ts             
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
        // Bad: Waterfall request, exposes API endpoint, slower load, ignores RBAC
        fetch('/api/robots').then(res => res.json()).then(setRobots);
    }, []);
    return <div>{robots.map(r => <p key={r.id}>{r.name}</p>)}</div>;
}
```

**✅ GOOD: Server Component directly using Prisma with RBAC (Our Standard)**
```tsx
import prisma from '@/lib/prisma';
import { RobotCard } from '@/components/dashboard/RobotCard';
import { getUserSession } from '@/lib/auth';

// Server Component: Fetches securely on the server
export default async function FleetPage() {
    const user = await getUserSession();
    
    // RBAC: If normal Admin, lock query to their specific zone
    const zoneFilter = user.role === 'ADMIN' ? { location_id: user.zone_id } : {};

    const robots = await prisma.robot.findMany({
        where: zoneFilter,
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