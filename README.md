# Vertical Forest Dashboard - Command Center

## Project Overview
This project is an Industrial IoT (IIoT) read-only monitoring dashboard for autonomous track-based watering robots. It acts as a "Command Center" for monitoring, analytics, and centralized configuration management. The robots themselves are fully autonomous and pull their configuration via OTA endpoints.

### Core Features
*   **Real-time Monitoring:** Fleet-wide overview of robot statuses, battery levels, and current activities.
*   **Advanced Analytics:** Moisture trends and water usage visualization (ml derived from Time x Flowrate).
*   **OTA Configuration:** Centralized management of robot track assignments and plant moisture targets.
*   **RBAC (Role-Based Access Control):** Granular access management for Super Admins and Zone Admins.
*   **Audit Logging:** Comprehensive event logs for all system activities and user actions.
*   **IoT Integration:** Secure endpoints for telemetry ingestion and OTA config fetching.

## Tech Stack
*   **Framework:** Next.js 16+ (App Router, Server Components, Server Actions)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Styling:** Tailwind CSS 4+
*   **Charts:** Recharts
*   **Icons:** Lucide React
*   **Auth:** Custom JWT-based session management (jose)

## Getting Started

### Prerequisites
*   Node.js 18+
*   PostgreSQL instance

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables (see `.env.example`).
4.  Run Prisma migrations and seed the database:
    ```bash
    npx prisma db push
    npm run prisma:seed
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```

## Architecture Overview
The project follows a **Server-First** approach using Next.js App Router.
*   **Server Actions:** All database mutations (CRUD) are handled via Server Actions in `actions/`.
*   **Data Access Layer:** `lib/data-access.ts` centralizes RBAC-filtered Prisma queries.
*   **IoT Endpoints:** `app/api/` contains secure routes for hardware interaction (protected via API Key).
*   **UI Components:** A mix of Server Components (for data fetching) and Client Components (for interactivity).

## Security
*   **JWT Sessions:** 2-hour sliding window sessions stored in secure, httpOnly cookies.
*   **API Security:** IoT endpoints require an `x-api-key` header.
*   **RBAC Enforcement:** Validated at both the UI level (Sidebar) and the Data Access level.

## Folder Structure
```text
planet_website/
├── actions/             # Server Actions (Auth, Robots, Users, Plant Master)
├── app/                 # Next.js Pages & API Routes
│   ├── (dashboard)/     # Protected Dashboard Layout & Pages
│   └── api/             # IoT Hardware Endpoints
├── components/          # Reusable UI (Charts, Tables, Forms)
├── lib/                 # Shared logic (Prisma, Session, Utils, Data Access)
├── prisma/              # Schema & Seeding scripts
└── public/              # Static assets
```

## Maintenance & Updates
*   **Schema Changes:** Update `prisma/schema.prisma` and run `npx prisma generate`.
*   **Styling:** Custom CI colors (Forest Green `#0E6633`, Pulse Green `#22a042`) are applied via Tailwind.
*   **Deployment:** Optimized for Vercel or any Node.js environment supporting PostgreSQL.
