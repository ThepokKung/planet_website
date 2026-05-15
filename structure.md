# Vertical Forest Dashboard - Technical Structure

## 1. Directory Overview

| Folder | Responsibility |
| :--- | :--- |
| `actions/` | **Server Actions**: All DB mutations. Implements validation (Zod) and RBAC checks. |
| `app/` | **App Router**: Contains layouts, pages, and API routes. |
| `app/(dashboard)/` | **Protected Routes**: Dashboard, Analytics, Setup, User Management. |
| `app/api/` | **IoT Endpoints**: `/config` (OTA) and `/logs` (Telemetry). Protected by `IOT_API_KEY`. |
| `components/` | **UI Library**: Atomic and composite components. Uses `@/lib/utils` for styling. |
| `lib/` | **Core Logic**: Prisma instance, Session management, RBAC Data Access, Utilities. |
| `prisma/` | **Database Layer**: Schema definition and mock data seeding. |

---

## 2. Core Modules & Services

### Data Access Layer (`lib/data-access.ts`)
Centralizes the logic for fetching data based on the user's role. 
- `SUPER ADMIN`: Accesses all locations and robots.
- `ADMIN`: Filtered by `assignedLocations` link in the `User` table.

### Session Management (`lib/session.ts`)
Handles JWT encryption/decryption using `jose`. 
- Secret key sourced from `JWT_SECRET`.
- Sliding session update implemented in `middleware.ts`.

### Security Layer
- **Middleware**: Protects all dashboard routes. Excludes IoT endpoints which use Header-based Auth.
- **API Key**: Hardware devices must provide `x-api-key` matching `IOT_API_KEY`.

---

## 3. Data Flow

1.  **Hardware Ingestion**: Robots POST to `/api/logs` -> Zod Validation -> Bulk `createMany` in PostgreSQL.
2.  **OTA Config**: Robots GET `/api/config` -> `lib/data-access` fetches assignment -> Formatted JSON response.
3.  **UI Updates**: User performs action -> Server Action -> DB Update -> `revalidatePath` triggers Next.js cache refresh.

---

## 4. Coding Standards
- **Naming**: camelCase for variables/functions, PascalCase for components/models.
- **Styling**: Tailwind 4 utilities. Avoid custom CSS files.
- **Safety**: No `any` types. Explicit interfaces for DB relations.
- **Performance**: Use Server Components for initial load; Client Components for Recharts/Interactivity.
