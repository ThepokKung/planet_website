# Vertical Forest Dashboard - Project Context

## Project Overview
This project is an Industrial IoT (IIoT) read-only monitoring dashboard for autonomous track-based watering robots. It acts as a "Command Center" for monitoring, analytics, and centralized configuration management. The robots themselves are fully autonomous.

### Tech Stack
*   **Framework:** Next.js 16+ (App Router)
*   **Language:** TypeScript
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Styling:** Tailwind CSS 4+
*   **Charts:** Recharts
*   **Icons:** Lucide React
*   **Auth:** Custom JWT (jose)

## Building and Running
*   **Install dependencies:** `npm install`
*   **Start development server:** `npm run dev`
*   **Build for production:** `npm run build`
*   **Start production server:** `npm start`
*   **Lint code:** `npm run lint`

### Database Commands (Prisma)
*   **Update Prisma Client:** `npx prisma generate` (Run after ANY schema changes)
*   **Sync schema to local DB:** `npx prisma db push`
*   **Open local DB GUI:** `npx prisma studio`
*   **Seed Database:** `npm run prisma:seed` (configured in package.json)

## Development Conventions & Constraints

### General Directives
*   **Read-Only UI Constraint:** Do NOT build forms or buttons that alter the robot's physical real-time movement. The dashboard displays states, it does not command them.
*   **Hardware Config Mutation (OTA):** Configuration is saved directly to PostgreSQL. ESP32 devices use HTTP Polling (`GET /api/config?robot_id=XYZ`) to fetch their assigned configuration.
*   **Plant Master Data:** When configuring a robot's pot, you CANNOT type a custom plant name. You MUST select from a dropdown populated by the `PlantTemplate` table.
*   **Analytics Constraints:**
    *   Must include a Robot filter (Dropdown/Checkbox) to view specific or all robots.
    *   Water usage calculation is in `ml` (derived from Flowrate * Time). Always add the UI note: `"ค่า ml ที่แสดงคือค่าเปรียบเทียบจากการคำนวณ (เวลา x Flowrate)"`.

### Role-Based Access Control (RBAC)
*   **SUPER ADMIN:** Full access to all data, all zones (Locations), user management, and Plant Master templates.
*   **ADMIN:** Restricted access. Can ONLY view and manage data related to their assigned `zone_id` (Location), and manage Plant Master templates.
*   **Route Protection:** ALL routes (except `/login`, `/api/config`, `/api/logs`) are protected by `middleware.ts`. Unauthenticated access redirects to `/login`.
*   **Data Fetching:** All Prisma queries must respect the user's role. For `ADMIN`, append `where: { locationId: { in: userLocationIds } }` (or similar logic implemented in `lib/data-access.ts`).

### Architecture & Code Style
*   **Server-First:** Use Next.js App Router conventions. Every page and component is a Server Component by default.
*   **Client Components:** Add `"use client"` ONLY when strictly necessary (e.g., using Recharts, `useState`, `useEffect`, or onClick event listeners). Keep client components as small as possible.
*   **Server Actions:** Use Server Actions (`"use server"`) in the `actions/` directory for any database mutations (e.g., CRUD for users, robot config).
*   **Styling (Vertical Forest CI):** Use Tailwind CSS exclusively.
    *   Primary Theme: Dark Forest Green (`#0E6633`)
    *   Active/Positive Status: Pulse Green (`#22a042`)
    *   Alerts/Errors: Destructive Red (`#ef4444`)
*   **Type Safety:** ALWAYS explicitly define TypeScript types/interfaces for nested database relations.

### Security
*   NEVER commit secrets, `.env` files, or database credentials.
*   NEVER generate mock data using hardcoded arrays; ALWAYS fetch from Prisma.
*   Hardware fetching OTA configs requires proper CORS headers in Next.js API Routes.

## Directory Structure
*   `actions/`: Server Actions for database mutations.
*   `app/`: Next.js App Router (Pages & API).
    *   `app/(dashboard)/`: Protected Dashboard Routes (`/dashboard`, `/analytics`, `/plant-master`, `/plants`, `/details`, etc.).
    *   `app/api/`: IoT Endpoints (`/api/config`, `/api/logs`).
    *   `app/login/`: Public Authentication page.
*   `components/`: Reusable UI & Client Components.
*   `lib/`: Shared utilities, Prisma client instance (`prisma.ts`), Session logic (`session.ts`), and Data Access logic (`data-access.ts`).
*   `prisma/`: Database Schema (`schema.prisma`) & Seed scripts.

## Database Model Overview (Prisma)
*   **User:** Authentication & RBAC.
*   **Location:** Physical zones where robots operate.
*   **Robot:** The hardware unit.
*   **Pot:** A specific track/container on a robot.
*   **Plant:** The living specimen; holds current moisture targets.
*   **PlantTemplate:** Master data for plant species.
*   **WateringLog:** Record of every hydration event.
*   **RobotLog:** General system events and errors.